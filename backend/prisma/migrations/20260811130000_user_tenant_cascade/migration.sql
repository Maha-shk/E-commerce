-- Deleting a tenant is meant to remove the whole store, and the API already
-- demands the tenant slug as confirmation before doing it. `User.tenantId` was
-- the one tenant-owned foreign key left on RESTRICT, so any store that had ever
-- registered a customer could not be deleted at all.

ALTER TABLE "User" DROP CONSTRAINT "User_tenantId_fkey";

ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
