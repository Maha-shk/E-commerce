"use client";

import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductBrowser } from "@/components/customer/ProductBrowser";

export default function NewArrivalsPage() {
  return (
    <CustomerPageShell>
      <ProductBrowser
        title="New Arrivals"
        description="The latest additions to the catalogue."
        query={{ newArrivals: true }}
        emptyMessage="Nothing new matches these filters just yet."
      />
    </CustomerPageShell>
  );
}
