# Backend: multi-tenant catalog hierarchy

Reference for the backend change that replaced the flat `Category → Product`
catalog with a fixed five-level hierarchy inside isolated tenants.

```
Tenant
└── Category        Electronics, Furniture, Hardware
    └── Company     Samsung, Apple, WoodCraft, Bosch
        └── ProductType   Mobile Phones, Chairs, Drilling Machines
            └── Model     Galaxy S25, AB8, X10
                └── Product   LCD Display, Battery, Seat, Motor
```

Two invariants drive every design decision below:

1. **The hierarchy is total.** Each level has a *required* foreign key to its
   parent. A Product cannot exist without a Model, a Model cannot exist without
   a ProductType, and so on up to the Tenant. Orphans are impossible at the
   database level, not merely discouraged by application code.
2. **Every business row belongs to exactly one tenant.** Catalog and commerce
   tables carry `tenantId`. Child tables (`OrderItem`, `CartItem`,
   `ProductImage`, `Message`, …) inherit their tenant through their parent
   rather than duplicating the column, which is what stops the two from ever
   disagreeing.

---

## 1. Database changes

### New tables

| Table | Purpose | Parent FK | Unique constraint |
|---|---|---|---|
| `Tenant` | One storefront + admin workspace | — | `slug`, `domain` |
| `Company` | Brand inside a category | `categoryId` → `Category` | `(categoryId, slug)` |
| `ProductType` | Product line inside a company | `companyId` → `Company` | `(companyId, slug)` |
| `Model` | Specific model inside a product type | `productTypeId` → `ProductType` | `(productTypeId, slug)` |

`Category` was kept and extended rather than recreated, so existing rows and
every `Product` already pointing at them survived the migration untouched.

### Shared shape across the four levels

All four carry the same fields, which is what lets one service, one DTO and one
set of admin screens serve them:

`id`, `tenantId`, `name`, `slug`, `description`, `imageUrl`, `status`,
`visibility`, `position`, `metaTitle`, `metaDescription`, `createdAt`,
`updatedAt`.

Level-specific extras: `Category` adds `icon`, `thumbnailName`,
`thumbnailSize`; `Model` adds `releaseYear`.

### Changed tables

| Table | Change |
|---|---|
| `Product` | **Removed** `brand` (free text) and `categoryId`. **Added** required `modelId` and `tenantId`. SKU uniqueness moved from global to `(tenantId, sku)`. |
| `User` | Added nullable `tenantId`. Email uniqueness moved from global to `(tenantId, email)` — the same person may hold an account on two storefronts. `tenantId: null` marks a **platform operator**. |
| `OrderItem` | Added `categoryName`, `companyName`, `productTypeName`, `modelName` — a classification snapshot taken at the moment of sale. |
| `Order` | Added `tenantId`; `orderNumber` unique per tenant; numbering restarts per tenant. |
| `Discount` | Added `tenantId`; `code` unique per tenant. |
| `Banner`, `FeaturedProduct`, `Cart`, `Wishlist`, `InventoryAdjustment`, `Conversation`, `Notification` | Added `tenantId`. |
| `Setting` | Unchanged — deliberately platform-level, not tenant-scoped. |

### Renamed enums

`CategoryStatus` → `CatalogStatus`, `CategoryVisibility` → `CatalogVisibility`.
They now describe every level, not just categories. **The stored values are
unchanged** (`ACTIVE`/`ARCHIVED`, `VISIBLE`/`HIDDEN`), so the API contract is
identical.

### Referential integrity

- Parent links between catalog levels are `onDelete: Restrict`. Deleting a level
  that still has children fails at the database, behind the API's own check.
- `Product.modelId` is `Restrict` — a model with stock cannot be silently
  deleted out from under its products.
- Every `tenantId` is `onDelete: Cascade`. Deleting a tenant removes the store
  wholesale; the endpoint demands the tenant slug as confirmation first.

### Migrations

| Migration | What it does |
|---|---|
| `20260811120000_tenant_catalog_hierarchy` | Creates `Tenant`/`Company`/`ProductType`/`Model`, renames the enums, adds `tenantId` everywhere, rewires `Product`, backfills, drops `Product.brand` and `Product.categoryId`. |
| `20260811130000_user_tenant_cascade` | `User.tenantId` FK from `Restrict` to `Cascade` so a store with customers can actually be deleted. |
| `20260812090000_placeholder_flag` | Adds `isPlaceholder` to all four levels and backfills it for the rows the first migration invented. Also copies legacy `Category.thumbnailName` into `imageUrl`. |

**Nothing was dropped.** The first migration:

- moves every existing row into a `Default Store` tenant (`slug: default`);
- turns each distinct `Product.brand` into a real `Company` under its category,
  so the removed column became structure instead of being lost;
- creates a placeholder `General` ProductType + Model per company so every
  existing product satisfies the now-required `modelId`;
- creates a hidden `Unclassified` category for products that had no category;
- backfills the `OrderItem` classification snapshot from the resulting chain.

Verified after applying: `prisma migrate diff` reports **no difference** between
the live database and the datamodel.

---

## 2. Removed / replaced

| Removed | Replaced by |
|---|---|
| `src/categories/` module (service, controller, DTO) | `src/catalog/` — one module serving all four levels |
| `GET/POST/PATCH/DELETE /api/admin/categories` | `/api/admin/catalog/categories` (same verbs) |
| `Product.brand` free-text field | `Company`, a first-class row with its own id, slug, logo and SEO fields |
| `Product.categoryId` | `Product.modelId`; category is reached through the chain |
| `GET /api/public/brands` returning `string[]` | Same path, now returning `Company` objects `{id, name, slug, imageUrl, categoryId}` |
| Reports joining `product.category` | `OrderItem.categoryName` snapshot — restructuring the catalog can no longer rewrite historical figures |

---

## 3. Folder structure

```
src/
  tenancy/                     ← NEW
    tenant.types.ts            TenantContext, header names
    tenants.service.ts         resolution (cached) + platform CRUD
    tenant.guard.ts            global guard, attaches request.tenant
    tenants.controller.ts      /api/platform/tenants
    decorators/
      current-tenant.decorator.ts    @CurrentTenant('id')
      platform-scope.decorator.ts    @PlatformScope()
    dto/tenant.dto.ts

  catalog/                     ← NEW (replaces src/categories/)
    catalog.constants.ts       the hierarchy, described once
    catalog.service.ts         all CRUD + tree + breadcrumbs + counts
    catalog.controller.ts      /levels, /tree, /stats
    catalog-levels.controller.ts   /:level CRUD
    catalog-level.pipe.ts      URL segment → level spec
    dto/catalog.dto.ts

  common/
    dto/transformers.ts        ← NEW  ToBoolean()
    pipes/parse-optional-boolean.pipe.ts   ← NEW

  public/
    public-catalog.controller.ts   ← NEW  storefront navigation
```

### Why one module instead of four

The four levels are structurally identical — same fields, same CRUD, same
validation, same tenant scoping. Four hand-written services would be four
chances for that scoping to drift apart, and a tenant leak only has to happen
once. `catalog.constants.ts` describes the hierarchy as data:

```ts
export const COMPANY_SPEC: CatalogLevelSpec = {
  key: 'COMPANY',
  delegate: 'company',
  segment: 'companies',
  parent: { key: 'CATEGORY', foreignKey: 'categoryId', relation: 'category', … },
  child:  { key: 'PRODUCT_TYPE', relation: 'productTypes', … },
  ancestorPaths: { categoryId: ['categoryId'] },
  extraFields: [],
};
```

Every rule that depends on the shape of the tree — which parent a level
requires, how to reach an ancestor, what to cascade on delete — is read off this
registry. Adding a sixth level means adding an entry and a Prisma model; no
service or controller changes.

---

## 4. Tenant isolation

### How a request finds its tenant

`TenantGuard` runs as a global guard after `JwtAuthGuard`, and resolves in this
order — the trustworthy source wins:

1. **The signed JWT.** A logged-in user's tenant comes from their own account,
   so no header or body field can move them into someone else's data.
2. **`X-Tenant-Id` / `X-Tenant-Slug` header** — honoured *only* for an
   unauthenticated storefront visitor, or a platform SUPER_ADMIN with no tenant
   of their own. A tenant-bound admin sending this header is ignored.
3. **The request `Host`** — matched against `Tenant.domain`, then the leading
   subdomain against `Tenant.slug`.
4. **`?tenant=<slug>`** — for previews and local development.
5. **The only tenant**, when the installation has exactly one.
6. **`TENANT_FALLBACK_SLUG`** (default `default`) — server-configured, never
   caller-supplied. Keeps unmapped hosts working once a second tenant exists.

The result lands on `request.tenant` and is read by `@CurrentTenant('id')`.
Services never take a tenant id from a body or query param.

`@PlatformScope()` opts a route out of resolution entirely. Only two use it:
`/api/platform/tenants` and `/api/health`.

### Guarantees, and how they are enforced

| Guarantee | Mechanism |
|---|---|
| Reads never cross tenants | Every `where` starts with `tenantId`; `findUnique` by id was replaced with `findFirst({ id, tenantId })` throughout |
| A foreign id reads as **404, not 403** | Scoped lookups return nothing, so no one can probe which ids exist elsewhere |
| Writes cannot cross tenants | `CatalogService.resolveParent` and `requireModel` validate the parent/model *inside the caller's tenant* before any insert |
| A tenant admin cannot impersonate another | The header branch is unreachable when `user.tenantId` is set |
| Suspending a store locks it immediately | `JwtStrategy` re-reads the user and tenant status on every request, not at token expiry |

### Platform operator

A `SUPER_ADMIN` with `tenantId: null` belongs to no store. It creates tenants
and administers any of them via `X-Tenant-Slug`. Because login is tenant-scoped,
`AuthService.login` falls back to a platform lookup when the tenant-scoped one
misses — otherwise such an account could be created but never used.

Seeded as `platform@cento.local` (`PLATFORM_ADMIN_EMAIL`), deliberately a
different address from `ADMIN_EMAIL`: two accounts sharing an email would make
storefront login ambiguous, since the tenant-scoped row always wins.

---

## 5. Validation rules

Enforced in `CatalogService`, returning specific messages rather than generic
400s:

| Rule | Response |
|---|---|
| A Category must not have a parent | `400 A Category is top-level and cannot have a parent` |
| Every other level must have one | `400 parentId is required: every Company belongs to a Category` |
| The parent must be the level directly above | `404 Product Type <id> not found in this store` |
| The parent must be in the caller's tenant | `404 Category <id> not found in this store` |
| Sibling slugs must be unique | `409 Another company here already uses the slug "samsung"` |
| The same slug under a *different* parent is fine | Allowed — "Chairs" can exist under both IKEA and WoodCraft |
| Delete with children | `409 … it still contains 3 Product Types. … or repeat with ?cascade=true` |
| Delete with products anywhere beneath | `409 … 29 product(s) still sit beneath it` — refused even with cascade |
| A Product must name a Model | `400` from `class-validator` on `modelId` |
| SKU unique per tenant | `409 SKU "…" is already in use` |

`?cascade=true` removes descendant *levels* but never products. Products carry
stock, pricing and order history; deleting them has to be a deliberate act in
the Products screen, not a side effect of tidying the tree.

---

## 6. Breaking changes

| # | Change | Impact |
|---|---|---|
| 1 | `/api/admin/categories` → `/api/admin/catalog/categories` | Update the admin categories screen |
| 2 | `Product.brand` gone | Read `product.company.name` |
| 3 | `Product.categoryId` gone | Read `product.category.id`; write `modelId` |
| 4 | `modelId` required on product create | The product form needs a 4-step catalog picker |
| 5 | `/api/public/brands` returns objects, not strings | `b.name` instead of `b` |
| 6 | Admin list responses gained `breadcrumb`, `childCount`, `productCount` | Additive |
| 7 | Storefront requests should send `X-Tenant-Slug` | Not yet required — `TENANT_FALLBACK_SLUG` covers single-store setups |

**Not broken:** the response envelope (`{ success, data, meta }`), pagination,
auth endpoints and token shape, cart/wishlist/order/checkout paths, and every
`status`/`visibility` value.

---

## 7. Architecture review

Checked against the acceptance criteria, with the evidence for each.

**The hierarchy is implemented correctly.** Verified end-to-end against a live
database: creating Company → ProductType → Model → Product returns the
breadcrumb `Electronics > Smoke Brand > Smoke Type > Smoke Model` at every step.
Attaching a Model directly to a Category is rejected.

**Tenant isolation is enforced everywhere.** Verified with two live tenants:

- a second tenant starts at zero rows;
- a tenant-A admin sending `X-Tenant-Slug: tenant-b` still sees tenant A's 18
  categories, not tenant B's one;
- reading, writing to, and deleting tenant B's category / model / product from
  tenant A all return 404;
- the same SKU (`BSH-X10-MOTOR`) and the same customer email exist independently
  in both tenants;
- the storefront tree differs per tenant header.

**No orphan records can exist.** Every parent FK is `NOT NULL`. The only way to
create a level is through an endpoint that resolves the parent inside the
caller's tenant first. Delete is `Restrict` at the database and refused by the
service above it.

**Relationships are properly enforced.** By foreign keys, not by convention. A
`ProductType` row physically cannot reference a `Category`.

**Clean architecture.** Controllers do routing and tenant injection only;
`CatalogService` holds the hierarchy rules; `catalog.constants.ts` holds the
shape of the tree as data. One implementation of the tenant filter, one of the
parent check, one of the slug rule.

**Scalable for future expansion.** A new level is one registry entry plus one
Prisma model. Counts are computed with a four-query roll-up rather than one
`COUNT` per row, so listing a large catalog does not degrade with node count.

### Follow-ups from the frontend integration pass

Four things surfaced when the frontend was wired against the running API, all
now fixed and verified:

| Finding | Resolution |
|---|---|
| `/admin/inventory` changed shape (`category` string → object, rows gained model/company) but was missing from the handover checklist | Documented as steps 12–13; it was the one change that would have shipped visibly broken |
| Product breadcrumbs omitted `levelLabel`, which catalog breadcrumbs carry | `toProductView` now reads its labels from the level registry, so both producers emit the identical entry shape |
| `withCounts=false` still returned a count | Uncounted nodes now return `productCount: null` — distinguishable from a genuine `0`. A Model still returns a real number, because its count rides along in the same query |
| No way to select the migration's placeholder nodes | `isPlaceholder` column on all four levels, `?isPlaceholder=` filter, and `stats.placeholders` |

Two further bugs were found in `reassign` while specifying it, before any
client existed to hit them:

- **Duplicate ids returned 404.** A multi-select can easily submit the same id
  twice; the count-based check read that as a missing product. Ids are now
  deduplicated first.
- **Not actually atomic.** The existence check and the write were separate
  queries, so a concurrent delete could half-apply a move. Both now share one
  transaction, and the 404 names the offending ids instead of saying "some".

A cap of 200 ids per call was added at the same time — the array was previously
unbounded, and so was the `IN (…)` list it became.

### Second integration pass

Two further design flaws surfaced, both raised as questions rather than bugs,
and both worth fixing rather than documenting around:

| Finding | Resolution |
|---|---|
| A Model returned a real `productCount` under `withCounts=false` while the three upper levels returned `null` | Nulled at **every** level. An exception one level makes is a contract people get wrong, and the free-ness was an artefact of today's schema, not a promise. `childCount` still carries the same figure for a Model, so nothing is lost |
| `reorder` assigns `position` by array index and so needs every sibling id — but `limit` caps at 100, making the order of a parent with more children inexpressible | Added `PATCH /:level/:id/move`, which names one node and one anchor and renumbers server-side. Works at any sibling count and from any page |

`reorder` also **now rejects an incomplete sibling set** (`400`) instead of
accepting it and colliding positions with the rows it omitted — it only ever
validated that the ids given *were* siblings, never that all siblings were
given. And both paths now write only the rows whose position actually changes,
so reordering two adjacent rows out of four hundred is two updates rather than
four hundred, and `updatedAt` stays honest about what a person touched.

### A bug in the fix itself, worth recording

`withCounts=false` initially still returned counts after the change. The cause
was in `ToBoolean`: the global `ValidationPipe` runs with
`enableImplicitConversion`, which coerces the string `"false"` to boolean `true`
*before* a custom `@Transform` sees it, and the helper's
`typeof value === 'boolean'` guard then passed that wrong value straight
through — the exact inversion it was written to prevent. It now reads the raw
value from `obj[key]` instead. Every `@ToBoolean()` query flag was affected, so
`?isPlaceholder=false` was silently returning placeholders too.

### Known trade-offs

- **Product counts** are a per-request roll-up over the tenant's level tables
  (4 queries, no N+1). For a catalog in the millions this should become a
  materialised view; pass `withCounts=false` to skip it on pickers.
- **Ancestor filters** (`/models?categoryId=…`) are relational joins rather than
  denormalised columns on `Model`. Correct by construction and never stale, at
  the cost of a join. Deliberate: denormalised ancestor ids go stale the moment
  a node is re-filed.
- **`TENANT_FALLBACK_SLUG` defaults to `default`.** Convenient for this
  single-store deployment; set it empty in a real multi-tenant deployment so an
  unidentified request is rejected rather than landing in one store.
- **Settings remain global.** Per the agreed scope. If tenants need their own
  store name, mail config or legal pages, `Setting` needs a `tenantId` and a
  compound primary key.

---

## 8. Running it

```bash
cd backend
npx prisma migrate deploy   # apply the two migrations
npx prisma generate
npx prisma db seed          # Electronics/Samsung/Galaxy S25, Furniture/WoodCraft/AB8, Hardware/Bosch/X10
npm run build && npm start
```

Seed accounts:

| Account | Role | Tenant |
|---|---|---|
| `platform@cento.local` / `$ADMIN_PASSWORD` | SUPER_ADMIN | none — platform operator |
| `admin@gmail.com` / `Admin123` | ADMIN | `default` |
| `manager@cento.local` / `StaffPass123!` | MANAGER | `default` |
| `support@cento.local` / `StaffPass123!` | SUPPORT | `default` |

Swagger: `http://localhost:4000/api/docs`.
