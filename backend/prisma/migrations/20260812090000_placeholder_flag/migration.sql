-- Marks the rows the hierarchy migration invented so existing products had a
-- parent to hang from. They are a clean-up list, and until now the only way to
-- find them was to guess at the name "General" — which an admin might also use
-- for a real node.
--
-- Also backfills Category.imageUrl from the legacy thumbnailName, so all four
-- levels can be rendered from the one shared field.

ALTER TABLE "Category"    ADD COLUMN "isPlaceholder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company"     ADD COLUMN "isPlaceholder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProductType" ADD COLUMN "isPlaceholder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Model"       ADD COLUMN "isPlaceholder" BOOLEAN NOT NULL DEFAULT false;

-- The earlier migration built these ids deterministically as '<prefix>' || md5(...),
-- so they are exactly 35 characters. Real ids are 25-character cuids, which is
-- what makes the length test — not the name — the reliable signal here.

UPDATE "Category"
   SET "isPlaceholder" = true
 WHERE "id" = 'cat_unclassified';

UPDATE "Company"
   SET "isPlaceholder" = true
 WHERE "id" LIKE 'cmp%'
   AND length("id") = 35
   AND "name" = 'General';

UPDATE "ProductType"
   SET "isPlaceholder" = true
 WHERE "id" LIKE 'pty%'
   AND length("id") = 35;

UPDATE "Model"
   SET "isPlaceholder" = true
 WHERE "id" LIKE 'mdl%'
   AND length("id") = 35;

-- Legacy Category art: `thumbnailName` held the image URL before every level
-- gained a shared `imageUrl`. Copy it across where it is a URL and nothing has
-- been set since, so the storefront can read one field.
UPDATE "Category"
   SET "imageUrl" = "thumbnailName"
 WHERE "imageUrl" IS NULL
   AND "thumbnailName" IS NOT NULL
   AND "thumbnailName" LIKE 'http%';

CREATE INDEX "Category_tenantId_isPlaceholder_idx"    ON "Category"("tenantId", "isPlaceholder");
CREATE INDEX "Company_tenantId_isPlaceholder_idx"     ON "Company"("tenantId", "isPlaceholder");
CREATE INDEX "ProductType_tenantId_isPlaceholder_idx" ON "ProductType"("tenantId", "isPlaceholder");
CREATE INDEX "Model_tenantId_isPlaceholder_idx"       ON "Model"("tenantId", "isPlaceholder");
