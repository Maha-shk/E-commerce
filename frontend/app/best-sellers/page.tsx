"use client";

import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductBrowser } from "@/components/customer/ProductBrowser";

export default function BestSellersPage() {
  return (
    <CustomerPageShell>
      <ProductBrowser
        title="Best Sellers"
        description="What other customers are buying most."
        query={{ bestsellers: true }}
        emptyMessage="No best sellers match these filters."
      />
    </CustomerPageShell>
  );
}
