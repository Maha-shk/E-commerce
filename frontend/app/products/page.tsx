"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductBrowser } from "@/components/customer/ProductBrowser";
import { LoadingState } from "@/components/customer/StateBlock";

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  return (
    <ProductBrowser
      title="All Products"
      description={
        search ? `Results for “${search}”` : "Browse the full catalogue."
      }
      query={{
        categoryId: category || undefined,
        search: search || undefined,
      }}
      emptyMessage={
        search
          ? `Nothing matches “${search}”. Try a different search or clear your filters.`
          : "Try adjusting your filters."
      }
    />
  );
}

export default function ProductsPage() {
  return (
    <CustomerPageShell>
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<LoadingState label="Loading products…" />}>
        <ProductsPageContent />
      </Suspense>
    </CustomerPageShell>
  );
}
