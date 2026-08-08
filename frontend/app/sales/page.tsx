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
        // Belt and braces: the API filters on `sale`, but this page's promise
        // is "only discounted products", so it enforces that itself too.
        guard={(product) => product.discountPercent > 0}
        emptyMessage="No discounted products match these filters."
      />
    </CustomerPageShell>
  );
}
