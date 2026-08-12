-- =============================================================================
-- Multi-tenancy + the Category > Company > ProductType > Model > Product tree.
--
-- Data is preserved, not dropped:
--   * every existing row moves into a single "Default" tenant;
--   * every existing Category becomes a level-1 Category unchanged;
--   * each distinct Product.brand becomes a real Company under its category,
--     so the column being removed turns into structure rather than being lost;
--   * a placeholder "General" ProductType + Model per company gives every
--     product the Model it now requires, ready for the admin to re-file.
-- =============================================================================

-- Slug helper, mirroring slugify() in src/common/utils/stock.util.ts.
-- Dropped again at the end of this migration.
CREATE OR REPLACE FUNCTION "__migration_slugify"(input TEXT) RETURNS TEXT AS $$
  SELECT btrim(
    regexp_replace(
      regexp_replace(lower(coalesce(input, '')), '[^a-z0-9\s-]', '', 'g'),
      '[\s_-]+', '-', 'g'
    ),
    '-'
  );
$$ LANGUAGE sql IMMUTABLE;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- These two now describe every catalog level, not just categories. Renaming the
-- type keeps every stored value (and therefore the API contract) identical.
ALTER TYPE "CategoryStatus" RENAME TO "CatalogStatus";
ALTER TYPE "CategoryVisibility" RENAME TO "CatalogVisibility";

-- -----------------------------------------------------------------------------
-- Tenant
-- -----------------------------------------------------------------------------

CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "logoUrl" TEXT,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

INSERT INTO "Tenant" ("id", "name", "slug", "status", "createdAt", "updatedAt")
VALUES ('tenant_default', 'Default Store', 'default', 'ACTIVE', now(), now());

-- -----------------------------------------------------------------------------
-- User: belongs to a tenant; email is unique per tenant rather than globally.
-- -----------------------------------------------------------------------------

ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
UPDATE "User" SET "tenantId" = 'tenant_default';

DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
CREATE INDEX "User_tenantId_role_idx" ON "User"("tenantId", "role");
CREATE INDEX "User_email_idx" ON "User"("email");

ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Category: gains tenancy, ordering and SEO fields.
-- -----------------------------------------------------------------------------

ALTER TABLE "Category" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Category" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Category" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN "metaTitle" TEXT;
ALTER TABLE "Category" ADD COLUMN "metaDescription" TEXT;

UPDATE "Category" SET "tenantId" = 'tenant_default';
ALTER TABLE "Category" ALTER COLUMN "tenantId" SET NOT NULL;

-- `icon` was NOT NULL DEFAULT 'home'; empty strings become NULL so the UI can
-- tell "no icon chosen" from "icon chosen".
ALTER TABLE "Category" ALTER COLUMN "icon" DROP NOT NULL;
ALTER TABLE "Category" ALTER COLUMN "icon" DROP DEFAULT;
UPDATE "Category" SET "icon" = NULL WHERE btrim("icon") = '';

-- Give existing categories a stable order instead of all sharing position 0.
WITH ordered AS (
    SELECT "id", (ROW_NUMBER() OVER (ORDER BY "createdAt" ASC))::INTEGER - 1 AS pos
    FROM "Category"
)
UPDATE "Category" c SET "position" = o.pos FROM ordered o WHERE c."id" = o."id";

DROP INDEX IF EXISTS "Category_slug_key";
DROP INDEX IF EXISTS "Category_status_idx";
CREATE UNIQUE INDEX "Category_tenantId_slug_key" ON "Category"("tenantId", "slug");
CREATE INDEX "Category_tenantId_status_idx" ON "Category"("tenantId", "status");
CREATE INDEX "Category_tenantId_position_idx" ON "Category"("tenantId", "position");

ALTER TABLE "Category" ADD CONSTRAINT "Category_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Company / ProductType / Model
-- -----------------------------------------------------------------------------

CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "CatalogVisibility" NOT NULL DEFAULT 'VISIBLE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_categoryId_slug_key" ON "Company"("categoryId", "slug");
CREATE INDEX "Company_tenantId_idx" ON "Company"("tenantId");
CREATE INDEX "Company_categoryId_position_idx" ON "Company"("categoryId", "position");
CREATE INDEX "Company_tenantId_status_idx" ON "Company"("tenantId", "status");

CREATE TABLE "ProductType" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "CatalogVisibility" NOT NULL DEFAULT 'VISIBLE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductType_companyId_slug_key" ON "ProductType"("companyId", "slug");
CREATE INDEX "ProductType_tenantId_idx" ON "ProductType"("tenantId");
CREATE INDEX "ProductType_companyId_position_idx" ON "ProductType"("companyId", "position");
CREATE INDEX "ProductType_tenantId_status_idx" ON "ProductType"("tenantId", "status");

CREATE TABLE "Model" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "status" "CatalogStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "CatalogVisibility" NOT NULL DEFAULT 'VISIBLE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "releaseYear" INTEGER,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Model_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Model_productTypeId_slug_key" ON "Model"("productTypeId", "slug");
CREATE INDEX "Model_tenantId_idx" ON "Model"("tenantId");
CREATE INDEX "Model_productTypeId_position_idx" ON "Model"("productTypeId", "position");
CREATE INDEX "Model_tenantId_status_idx" ON "Model"("tenantId", "status");

ALTER TABLE "Company" ADD CONSTRAINT "Company_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Company" ADD CONSTRAINT "Company_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductType" ADD CONSTRAINT "ProductType_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductType" ADD CONSTRAINT "ProductType_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Model" ADD CONSTRAINT "Model_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Model" ADD CONSTRAINT "Model_productTypeId_fkey"
    FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Backfill the hierarchy for products that exist today.
-- -----------------------------------------------------------------------------

-- Products without a category need somewhere to live. Created HIDDEN so it
-- never shows on the storefront before an admin has sorted it out.
INSERT INTO "Category" (
    "id", "tenantId", "name", "slug", "description", "status", "visibility",
    "position", "createdAt", "updatedAt"
)
SELECT
    'cat_unclassified', 'tenant_default', 'Unclassified', 'unclassified',
    'Products migrated without a category. Re-file these, then delete this category.',
    'ACTIVE', 'HIDDEN', 9999, now(), now()
WHERE EXISTS (SELECT 1 FROM "Product" WHERE "categoryId" IS NULL);

UPDATE "Product" SET "categoryId" = 'cat_unclassified' WHERE "categoryId" IS NULL;

-- Each distinct brand within a category becomes a Company. Ids are derived
-- deterministically so the ProductType/Model/Product steps below can join to
-- them without a RETURNING round-trip.
WITH brands AS (
    SELECT DISTINCT
        p."categoryId" AS category_id,
        COALESCE(NULLIF(btrim(p."brand"), ''), 'General') AS brand_name
    FROM "Product" p
), numbered AS (
    SELECT
        category_id,
        brand_name,
        "__migration_slugify"(brand_name) AS base_slug,
        ROW_NUMBER() OVER (
            PARTITION BY category_id, "__migration_slugify"(brand_name)
            ORDER BY brand_name
        ) AS dup_rank
    FROM brands
)
INSERT INTO "Company" (
    "id", "tenantId", "categoryId", "name", "slug", "description",
    "status", "visibility", "position", "createdAt", "updatedAt"
)
SELECT
    'cmp' || md5(category_id || '|' || brand_name),
    'tenant_default',
    category_id,
    brand_name,
    CASE
        WHEN dup_rank = 1 THEN COALESCE(NULLIF(base_slug, ''), 'company')
        ELSE COALESCE(NULLIF(base_slug, ''), 'company') || '-' || dup_rank
    END,
    '',
    'ACTIVE',
    'VISIBLE',
    0,
    now(),
    now()
FROM numbered;

-- One placeholder ProductType per company …
INSERT INTO "ProductType" (
    "id", "tenantId", "companyId", "name", "slug", "description",
    "status", "visibility", "position", "createdAt", "updatedAt"
)
SELECT 'pty' || md5(c."id"), c."tenantId", c."id", 'General', 'general',
       'Placeholder created during the hierarchy migration.',
       'ACTIVE', 'VISIBLE', 0, now(), now()
FROM "Company" c;

-- … and one placeholder Model per product type.
INSERT INTO "Model" (
    "id", "tenantId", "productTypeId", "name", "slug", "description",
    "status", "visibility", "position", "createdAt", "updatedAt"
)
SELECT 'mdl' || md5(pt."id"), pt."tenantId", pt."id", 'General', 'general',
       'Placeholder created during the hierarchy migration.',
       'ACTIVE', 'VISIBLE', 0, now(), now()
FROM "ProductType" pt;

-- -----------------------------------------------------------------------------
-- Product: now hangs off a Model, and `brand` / `categoryId` are gone.
-- -----------------------------------------------------------------------------

ALTER TABLE "Product" ADD COLUMN "tenantId" TEXT;
ALTER TABLE "Product" ADD COLUMN "modelId" TEXT;

UPDATE "Product" SET "tenantId" = 'tenant_default';

UPDATE "Product" p
SET "modelId" = 'mdl' || md5(
    'pty' || md5(
        'cmp' || md5(p."categoryId" || '|' || COALESCE(NULLIF(btrim(p."brand"), ''), 'General'))
    )
);

ALTER TABLE "Product" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Product" ALTER COLUMN "modelId" SET NOT NULL;

ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_categoryId_fkey";
DROP INDEX IF EXISTS "Product_categoryId_idx";
DROP INDEX IF EXISTS "Product_status_idx";
DROP INDEX IF EXISTS "Product_visibility_idx";
DROP INDEX IF EXISTS "Product_sku_key";

ALTER TABLE "Product" DROP COLUMN "categoryId";
ALTER TABLE "Product" DROP COLUMN "brand";

CREATE UNIQUE INDEX "Product_tenantId_sku_key" ON "Product"("tenantId", "sku");
CREATE INDEX "Product_tenantId_modelId_idx" ON "Product"("tenantId", "modelId");
CREATE INDEX "Product_modelId_idx" ON "Product"("modelId");
CREATE INDEX "Product_tenantId_status_idx" ON "Product"("tenantId", "status");
CREATE INDEX "Product_tenantId_visibility_idx" ON "Product"("tenantId", "visibility");

ALTER TABLE "Product" ADD CONSTRAINT "Product_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_modelId_fkey"
    FOREIGN KEY ("modelId") REFERENCES "Model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- OrderItem: snapshot the classification so reports survive catalog edits.
-- -----------------------------------------------------------------------------

ALTER TABLE "OrderItem" ADD COLUMN "categoryName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "companyName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "productTypeName" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "modelName" TEXT;

UPDATE "OrderItem" oi
SET "categoryName"    = cat."name",
    "companyName"     = cmp."name",
    "productTypeName" = pt."name",
    "modelName"       = m."name"
FROM "Product" p
JOIN "Model" m ON m."id" = p."modelId"
JOIN "ProductType" pt ON pt."id" = m."productTypeId"
JOIN "Company" cmp ON cmp."id" = pt."companyId"
JOIN "Category" cat ON cat."id" = cmp."categoryId"
WHERE oi."productId" = p."id";

-- -----------------------------------------------------------------------------
-- Tenancy for the remaining commerce tables.
-- -----------------------------------------------------------------------------

ALTER TABLE "InventoryAdjustment" ADD COLUMN "tenantId" TEXT;
UPDATE "InventoryAdjustment" SET "tenantId" = 'tenant_default';
ALTER TABLE "InventoryAdjustment" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "InventoryAdjustment_tenantId_idx" ON "InventoryAdjustment"("tenantId");
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Cart" ADD COLUMN "tenantId" TEXT;
UPDATE "Cart" SET "tenantId" = 'tenant_default';
ALTER TABLE "Cart" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Cart_tenantId_idx" ON "Cart"("tenantId");
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Wishlist" ADD COLUMN "tenantId" TEXT;
UPDATE "Wishlist" SET "tenantId" = 'tenant_default';
ALTER TABLE "Wishlist" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Wishlist_tenantId_idx" ON "Wishlist"("tenantId");
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Banner" ADD COLUMN "tenantId" TEXT;
UPDATE "Banner" SET "tenantId" = 'tenant_default';
ALTER TABLE "Banner" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Banner_type_isActive_idx";
CREATE INDEX "Banner_tenantId_type_isActive_idx" ON "Banner"("tenantId", "type", "isActive");
ALTER TABLE "Banner" ADD CONSTRAINT "Banner_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FeaturedProduct" ADD COLUMN "tenantId" TEXT;
UPDATE "FeaturedProduct" SET "tenantId" = 'tenant_default';
ALTER TABLE "FeaturedProduct" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "FeaturedProduct_section_isActive_idx";
CREATE INDEX "FeaturedProduct_tenantId_section_isActive_idx" ON "FeaturedProduct"("tenantId", "section", "isActive");
ALTER TABLE "FeaturedProduct" ADD CONSTRAINT "FeaturedProduct_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order" ADD COLUMN "tenantId" TEXT;
UPDATE "Order" SET "tenantId" = 'tenant_default';
ALTER TABLE "Order" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Order_orderNumber_key";
DROP INDEX IF EXISTS "Order_status_idx";
CREATE UNIQUE INDEX "Order_tenantId_orderNumber_key" ON "Order"("tenantId", "orderNumber");
CREATE INDEX "Order_tenantId_status_idx" ON "Order"("tenantId", "status");
ALTER TABLE "Order" ADD CONSTRAINT "Order_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Discount" ADD COLUMN "tenantId" TEXT;
UPDATE "Discount" SET "tenantId" = 'tenant_default';
ALTER TABLE "Discount" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Discount_code_key";
DROP INDEX IF EXISTS "Discount_category_idx";
CREATE UNIQUE INDEX "Discount_tenantId_code_key" ON "Discount"("tenantId", "code");
CREATE INDEX "Discount_tenantId_category_idx" ON "Discount"("tenantId", "category");
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation" ADD COLUMN "tenantId" TEXT;
UPDATE "Conversation" SET "tenantId" = 'tenant_default';
ALTER TABLE "Conversation" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Conversation_tenantId_idx" ON "Conversation"("tenantId");
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD COLUMN "tenantId" TEXT;
UPDATE "Notification" SET "tenantId" = 'tenant_default';
ALTER TABLE "Notification" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Notification_read_idx";
CREATE INDEX "Notification_tenantId_read_idx" ON "Notification"("tenantId", "read");
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------

DROP FUNCTION "__migration_slugify"(TEXT);
