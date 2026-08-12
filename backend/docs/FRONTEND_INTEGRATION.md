# Frontend integration guide — catalog hierarchy & multi-tenancy

Everything the frontend needs to rebuild the admin around the new hierarchy,
without reading backend code.

```
Category → Company → ProductType → Model → Product
```

- Base URL `/api` · Swagger `/api/docs`
- Envelope `{ success, data, meta }` · Auth `Authorization: Bearer <token>`

---

## 1. The model

| Level | URL segment | Example | Parent |
|---|---|---|---|
| Category | `categories` | Electronics | — |
| Company | `companies` | Samsung | Category |
| Product Type | `product-types` | Mobile Phones | Company |
| Model | `models` | Galaxy S25 | Product Type |
| Product | (`/admin/products`) | LCD Display | Model |

The four upper levels are **structurally identical** — same fields, same CRUD,
same validation. Build **one** list screen and **one** form component and reuse
them four times.

`GET /api/admin/catalog/levels` returns the hierarchy as data (order, labels,
segments, parent/child links). Drive navigation off it instead of hard-coding
four screens.

---

## 2. Conventions

### Envelope

```jsonc
{ "success": true, "data": { … } }

{ "success": true, "data": [ … ],
  "meta": { "page": 1, "limit": 20, "total": 47, "totalPages": 3 } }
```

### Errors — not wrapped

```jsonc
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Another company here already uses the slug \"samsung\"",
  "path": "/api/admin/catalog/companies",
  "timestamp": "2026-08-11T07:52:13.292Z"
}
```

`message` is a **string** for business-rule failures and a **string array** for
DTO validation failures — handle both. Messages are written to be shown as-is.

### Pagination & sorting

| Param | Type | Default |
|---|---|---|
| `page` | int ≥ 1 | 1 |
| `limit` | int 1–100 | 20 |
| `search` | string | — |
| `sortBy` | `position` \| `name` \| `createdAt` \| `updatedAt` | `position` |
| `sortOrder` | `asc` \| `desc` | `asc` |

---

## 3. Tenancy

The tenant is resolved **server-side, per request** — from the signed JWT for an
admin, from the hostname for a shopper. There is no tenant field on any payload.

**Today you need to change nothing:** `TENANT_FALLBACK_SLUG=default` means
`localhost` and any unmapped host resolve to the existing store. When the
platform goes multi-store, send `X-Tenant-Slug: <slug>` (or serve each tenant
from its own domain). Adding the header now is harmless.

Consequences for the UI:

- An id from another store returns **404, not 403**. Treat it as final.
- SKUs and customer emails are unique **per store**, not globally.
- Suspending a store logs its users out on their next request (401).

Store management (optional, separate area): `/api/platform/tenants`, SUPER_ADMIN
with no tenant only. Delete requires `?confirm=<slug>`.

---

## 4. Screens & navigation

| Route | Shows | Primary action |
|---|---|---|
| `/admin/catalog` | Tree + stat cards | Jump to any node |
| `/admin/catalog/categories` | All categories | New category |
| `/admin/catalog/categories/[id]` | Category + its companies | New company |
| `/admin/catalog/companies/[id]` | Company + its product types | New product type |
| `/admin/catalog/product-types/[id]` | Product type + its models | New model |
| `/admin/catalog/models/[id]` | Model + **its products** | New product |
| `/admin/products/[id]/edit` | Product form | Save |

Every detail route is the same component with a different `level` segment. Read
`childLevel` / `childLevelLabel` off the node to label the child table and its
Add button. A Model returns `childLevel: null` and
`childLevelLabel: "Products"` — render the products table instead.

### Drill-down calls

```
GET /api/admin/catalog/categories
GET /api/admin/catalog/categories/{id}            → node + breadcrumb
GET /api/admin/catalog/categories/{id}/children   → its companies
GET /api/admin/catalog/companies/{id}/children    → its product types
GET /api/admin/catalog/product-types/{id}/children → its models
GET /api/admin/products?modelId={id}              → its products
```

### Breadcrumbs — never build them by hand

Every node response and every list row carries `breadcrumb`, root first,
including the node itself:

```jsonc
"breadcrumb": [
  { "id": "…", "name": "Electronics", "slug": "electronics",
    "level": "CATEGORY", "levelLabel": "Category", "segment": "categories" },
  { "id": "…", "name": "Samsung", "slug": "samsung",
    "level": "COMPANY", "levelLabel": "Company", "segment": "companies" }
]
```

```ts
const href = (c) => `/admin/catalog/${c.segment}/${c.id}`;
```

Products carry the full four-entry trail, in the same entry shape as catalog
nodes — `{ id, name, slug, level, levelLabel, segment }` from both producers.

---

## 5. Catalog endpoints

`:level` = `categories` | `companies` | `product-types` | `models`

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/catalog/levels` | The hierarchy as data. Fetch once, cache. |
| GET | `/api/admin/catalog/tree` | Nested tree. `?depth=0..3` `?categoryId=` `?search=` `?withCounts=` |
| GET | `/api/admin/catalog/stats` | `{ categories, companies, productTypes, models, products, emptyModels, placeholders }` |
| GET | `/api/admin/catalog/:level` | List. Filters below. |
| POST | `/api/admin/catalog/:level` | Create. `parentId` required except for categories. |
| GET | `/api/admin/catalog/:level/:id` | One node + breadcrumb. |
| GET | `/api/admin/catalog/:level/:id/children` | Children, already at the right level. 404 on a Model. |
| GET | `/api/admin/catalog/:level/:id/breadcrumb` | Just the trail (usually unnecessary). |
| PATCH | `/api/admin/catalog/:level/:id` | Partial update. A new `parentId` re-files the subtree. |
| PATCH | `/api/admin/catalog/:level/reorder` | `{ parentId?, orderedIds: string[] }` |
| DELETE | `/api/admin/catalog/:level/:id` | 409 while children exist. `?cascade=true`. Never deletes products. |

### List filters

`parentId`, `categoryId`, `companyId`, `productTypeId`, `search`, `status`,
`visibility`, `isPlaceholder`, `page`, `limit`, `sortBy`, `sortOrder`,
`withCounts`.

---

## 6. Payloads & shapes

### Create / update body (all four levels)

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 1–160 |
| `parentId` | string | all but Category | The level directly above, in your store |
| `slug` | string | no | Derived from name. Unique among siblings. Max 180 |
| `description` | string | no | Max 1000 |
| `imageUrl` | string | no | |
| `status` | `ACTIVE`\|`ARCHIVED` | no | Default `ACTIVE` |
| `visibility` | `VISIBLE`\|`HIDDEN` | no | Default `VISIBLE` |
| `position` | int ≥ 0 | no | Appended last if omitted |
| `metaTitle` / `metaDescription` | string | no | 200 / 500 |
| `icon`, `thumbnailName`, `thumbnailSize` | string | no | **Category only** |
| `isPlaceholder` | boolean | no | Send `false` to mark a migration placeholder as filed |
| `releaseYear` | int 1900–2200 | no | **Model only** |

```http
POST /api/admin/catalog/companies
{ "name": "Samsung", "parentId": "cmsi25y8l0008wyes41kbknnb" }
```

### Node response

```jsonc
{
  "id": "cmsocanzp000bwy38t2wvsp45",
  "level": "COMPANY", "levelLabel": "Company", "depth": 1,
  "tenantId": "tenant_default",

  "name": "Samsung", "slug": "samsung", "description": "", "imageUrl": null,
  "status": "ACTIVE", "visibility": "VISIBLE", "position": 0,
  "metaTitle": null, "metaDescription": null,

  "parentId": "cmsi25y8l0008wyes41kbknnb",
  "parentLevel": "CATEGORY",
  "parent": { "id": "…", "name": "Electronics", "slug": "electronics" },
  "breadcrumb": [ /* root-first, includes self */ ],

  "isPlaceholder": false,

  "childLevel": "PRODUCT_TYPE",
  "childLevelLabel": "Product Types",
  "childCount": 3,       // direct children
  "productCount": 29,    // products beneath; null when withCounts=false

  "createdAt": "…", "updatedAt": "…"
}
```

---

## 7. Products

> **Breaking:** `brand` and `categoryId` are gone. `modelId` is **required**.
> The Company is the brand now.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/products` | `modelId` / `productTypeId` / `companyId` / `categoryId`, `search`, `status`, `visibility`, `sortBy` |
| GET | `/api/admin/products/:id` | |
| POST | `/api/admin/products` | `modelId` required |
| PATCH | `/api/admin/products/:id` | A new `modelId` re-files the product |
| POST | `/api/admin/products/reassign` | `{ productIds: string[], modelId }` — bulk move. Max **200** ids, duplicates ignored, all-or-nothing |
| DELETE | `/api/admin/products/:id` | Allowed even if it appears in orders |

### Create body

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | yes | 2–200 |
| `modelId` | string | **yes** | Must be a Model in your store |
| `sku` | string | yes | 1–60, unique per store |
| `price` | number | yes | ≥ 0, 2 decimals |
| `stock` | int | no | ≥ 0, default 0. Drives `status` |
| `discount` | int | no | 0–100 |
| `description` | string | no | Max 2000 |
| `visibility` | `PUBLIC`\|`PRIVATE`\|`SCHEDULED` | no | |
| `scheduledDate` | ISO date | if SCHEDULED | |
| `tags`, `images`, `variants` | string[] | no | images/variants **replace** all on PATCH |
| `unitValue` | number | no | Inventory valuation |

### Product response

```jsonc
{
  "id": "…", "name": "LCD Display Assembly — Samsung Galaxy S25",
  "sku": "SAM-S25-LCD", "price": 189, "stock": 42, "status": "IN_STOCK",
  "images": ["…"], "variants": ["With Frame", "Panel Only"],

  "modelId": "…",
  "model":       { "id": "…", "name": "Galaxy S25",    "slug": "galaxy-s25" },
  "productType": { "id": "…", "name": "Mobile Phones", "slug": "mobile-phones" },
  "company":     { "id": "…", "name": "Samsung", "slug": "samsung", "imageUrl": null },
  "category":    { "id": "…", "name": "Electronics",   "slug": "electronics" },
  "breadcrumb":  [ /* 4 entries */ ]
}
```

### The catalog picker (product form)

Four dependent selects; clearing one clears everything below it.

```
GET /api/admin/catalog/categories?limit=100&withCounts=false
GET /api/admin/catalog/companies?parentId={categoryId}&withCounts=false
GET /api/admin/catalog/product-types?parentId={companyId}&withCounts=false
GET /api/admin/catalog/models?parentId={productTypeId}&withCounts=false
→ submit only modelId
```

Use `withCounts=false` on pickers — it skips the four-query roll-up, and
`productCount` then comes back as **`null`** ("not counted") rather than `0`, so
an uncounted node is never mistaken for an empty one. A **Model is the
exception**: its count rides along in the same query as the row, so it is always
a real number. Type the field as `number | null`.

When editing, seed all four selects from the product's `breadcrumb`.

Searchable alternative: `GET /api/admin/catalog/models?search=…` returns models
with their full breadcrumb, so one dropdown can show
"Galaxy S25 — Electronics › Samsung › Mobile Phones".

### Bulk move (`POST /admin/products/reassign`)

```jsonc
// request
{ "productIds": ["cm…a", "cm…b"], "modelId": "cm…z" }

// 200
{ "message": "2 product(s) moved", "count": 2, "modelId": "cm…z" }
```

- **Cap:** 200 ids per call. Over that → `400 productIds must contain no more than 200 elements`. Chunk client-side beyond it.
- **Duplicates** in the array are ignored, not an error.
- **All-or-nothing**, in one transaction. If any id is missing the whole move is
  rolled back and the response names them:
  `404 These products do not exist in this store: <id>, <id>`.
- There is no partial-success shape — a `200` means every id moved.

---

## 7b. Placeholder nodes ("needs filing")

The hierarchy migration invented nodes so existing products had a parent. They
are flagged, not guessed at:

| Field / param | Where |
|---|---|
| `isPlaceholder: boolean` | On every catalog node and tree node |
| `?isPlaceholder=true` | List filter — the "needs filing" view |
| `?isPlaceholder=false` | Only genuine catalog |
| `stats.placeholders` | `{ categories, companies, productTypes, models, total }` |

```
GET /api/admin/catalog/models?isPlaceholder=true    → the General models
GET /api/admin/catalog/stats                        → placeholders.total for a banner
PATCH /api/admin/catalog/models/{id} { "isPlaceholder": false }
```

Clearing the flag is how an admin says "this one is real". The typical clean-up
is: list placeholders → for each, bulk-move its products to a real model →
delete the placeholder.

`stats.emptyModels` is a **different** set — models with no products at all,
which includes genuine ones an admin created but hasn't stocked yet.

---

## 7c. Inventory rows

`GET /api/admin/inventory` returns the classification as objects, not strings:

```jsonc
{
  "id": "…", "name": "LCD Display Assembly — Samsung Galaxy S25",
  "sku": "SAM-S25-LCD",
  "model":       { "id": "…", "name": "Galaxy S25" },
  "productType": { "id": "…", "name": "Mobile Phones" },
  "company":     { "id": "…", "name": "Samsung" },
  "category":    { "id": "…", "name": "Electronics" },
  "stock": 42, "lastUpdated": "…", "unitValue": 117.18
}
```

Filters: `modelId`, `productTypeId`, `companyId`, `categoryId`, `status`,
`search`, plus pagination.

---

## 8. Search & filtering

| Goal | Request |
|---|---|
| Companies in a category | `/catalog/companies?parentId={categoryId}` |
| Every model in a category | `/catalog/models?categoryId={id}` |
| Every model of a company | `/catalog/models?companyId={id}` |
| Archived only | `/catalog/companies?status=ARCHIVED` |
| Products under a company | `/admin/products?companyId={id}` |
| Low stock in a category | `/admin/products?categoryId={id}&status=LOW_STOCK` |
| Filtered tree | `/catalog/tree?search=iphone&depth=3` |

Catalog search matches name/slug/description. Product search matches name, SKU,
model name and company name. Tree search **prunes**: a branch is kept when it
matches or contains a match, with the ancestors leading to it.

Debounce ~300ms; reset `page` to 1 when a filter changes.

---

## 9. Validation

| Rule | Status | Message |
|---|---|---|
| Category given a parent | 400 | A Category is top-level and cannot have a parent |
| Missing `parentId` | 400 | parentId is required: every Company belongs to a Category |
| Wrong parent level | 404 | Product Type `<id>` not found in this store |
| Parent in another store | 404 | Category `<id>` not found in this store |
| Duplicate sibling slug | 409 | Another company here already uses the slug "samsung" |
| Delete with children | 409 | … it still contains 3 Product Types … or repeat with `?cascade=true` |
| Delete with products beneath | 409 | … 29 product(s) still sit beneath it |
| Duplicate SKU | 409 | SKU "…" is already in use |
| SCHEDULED without a date | 400 | scheduledDate is required when visibility is SCHEDULED |

Worth knowing:

- **Slugs are unique per parent, not globally.** Don't validate globally.
- Omitting `slug` is fine — derived from `name`.
- Unknown body fields are **rejected** (400). Send only changed fields on PATCH.
- Archiving/hiding a node hides its subtree from the storefront, but children
  keep their own `status` — warn the user.

---

## 10. States & errors

**Loading.** Skeleton rows for lists. Fire node + children in parallel and
render the header as soon as the node lands. Optimistic UI is worth it for
reorder only; roll back on failure.

**Empty states** — one per level, each naming the parent:

| Where | Message | Action |
|---|---|---|
| No categories | Start your catalog with a category — Electronics, Furniture, Hardware. | New Category |
| Category, no companies | No companies in Electronics yet. Add the brands you stock. | New Company |
| Company, no product types | No product types for Samsung yet — Mobile Phones, Tablets, … | New Product Type |
| Product type, no models | No models under Mobile Phones yet. | New Model |
| Model, no products | No products for Galaxy S25 yet. Add the parts you sell. | New Product |
| Search, no hits | Nothing matches "xyz". | Clear search |

**Errors**

| Status | Meaning | Do |
|---|---|---|
| 400 | Validation / business rule | Show `message` inline |
| 401 | Token expired or store suspended | Refresh once, then login |
| 403 | Role not permitted | Explain; don't retry |
| 404 | Gone, or another store's | Not-found state; back to parent list |
| 409 | Conflict / delete blocked | Show `message`; offer the unblocking action |
| 429 | Rate limited (100/min per IP) | Back off |
| 500 | Server error | Generic message + retry |

Make 409-on-delete actionable: the message names the blocker, so offer
"Delete everything inside" (retries with `?cascade=true`) or "Move products"
(links to the filtered products table).

---

## 11. Permissions

| Role | Read catalog | Write catalog | Manage staff | Manage stores |
|---|---|---|---|---|
| `SUPER_ADMIN` | ✅ | ✅ | ✅ | only if it has no tenant |
| `ADMIN` | ✅ | ✅ | ✅ | ❌ |
| `MANAGER` | ✅ | ✅ | ❌ | ❌ |
| `SUPPORT` | ✅ | ❌ | ❌ | ❌ |
| `CUSTOMER` | ❌ | ❌ | ❌ | ❌ |

Hide create/edit/delete controls for `SUPPORT` rather than letting them 403.
Role comes from `GET /api/auth/me`.

---

## 12. Storefront

| Method | Path | Notes |
|---|---|---|
| GET | `/api/public/catalog/tree` | Navigation menu. `?depth=1..3` |
| GET | `/api/public/catalog/:level` | Same filters, minus status/visibility |
| GET | `/api/public/catalog/:level/:id` | Node + breadcrumb + children in one call |
| GET | `/api/public/catalog/breadcrumb/:level/:id` | Trail only |
| GET | `/api/public/products` | Now accepts `categoryId`, `companyId`, `productTypeId`, `modelId` |
| GET | `/api/public/brands` | **Changed:** objects, not strings |

Archived/hidden branches are stripped server-side and 404 even by direct id.
Storefront products keep `brand` (the company name) under its old key.

---

## 13. Migration checklist

1. Point the categories screen at `/admin/catalog/categories` — `lib/api/services/admin.ts`
2. Delete the placeholder data in `lib/admin/categories.ts`; type from the real response
3. Build the shared level list + form components — new `components/admin/catalog/`
4. Add the four drill-down routes — `app/admin/catalog/…`
5. Replace the product form's category select with the 4-step picker; submit `modelId`
6. Remove the `brand` input; show `product.company.name` read-only
7. Add hierarchy columns to the products table
8. Update the sidebar: Catalogue → Categories, Companies, Product Types, Models, Products — `lib/admin/nav.ts`
9. `/public/brands` returns objects — use `b.name` — `components/customer/ProductFilters.tsx`
10. Drive the storefront menu off `/public/catalog/tree` — `components/customer/SiteHeader.tsx`
11. Optional: send `X-Tenant-Slug` on every request — `lib/api/request.ts`
12. **`/admin/inventory` changed shape** — `category` went from `string | null`
    to `{ id, name }`, and rows gained `model`, `productType` and `company`.
    Rendering the old field directly prints `[object Object]` —
    `app/admin/inventory/page.tsx`
13. Inventory also gained ancestor filters: `?modelId=` `?productTypeId=`
    `?companyId=` `?categoryId=` alongside `status` and `search`

**Existing data is intact.** The migration turned each old `Product.brand` into
a real Company under its category and inserted placeholder `General` product
types and models so every product satisfies the required `modelId`. Those
`General` nodes are the clean-up list.

### Local setup

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run build && npm start   # http://localhost:4000/api  ·  docs at /api/docs
```

Sign in with `admin@gmail.com` / `Admin123` (ADMIN, default store).
