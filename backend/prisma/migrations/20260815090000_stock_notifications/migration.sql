-- Back-in-stock waiting list. A shopper who finds a product out of stock can
-- ask to be told when it returns; the row is discharged the moment stock rises
-- above zero.

CREATE TABLE "StockNotification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockNotification_pkey" PRIMARY KEY ("id")
);

-- One row per person per product: asking again re-arms the existing row rather
-- than queuing a second copy of the same promise.
CREATE UNIQUE INDEX "StockNotification_productId_email_key"
    ON "StockNotification"("productId", "email");

CREATE INDEX "StockNotification_tenantId_idx" ON "StockNotification"("tenantId");

-- The restock query: everyone still waiting on one product.
CREATE INDEX "StockNotification_productId_notifiedAt_idx"
    ON "StockNotification"("productId", "notifiedAt");

ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SetNull rather than Cascade: deleting an account must not silently drop a
-- promise made to that address, which may still be reachable.
ALTER TABLE "StockNotification" ADD CONSTRAINT "StockNotification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
