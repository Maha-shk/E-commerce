"use client";

import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductBrowser } from "@/components/customer/ProductBrowser";

export default function SalesPage() {
  return (
    <CustomerPageShell>
      <ProductBrowser
        title="Sales"
        description="Everything currently discounted."
        query={{ sale: true }}
        emptyMessage="No discounted products match these filters."
      />
    </CustomerPageShell>
  );
}
