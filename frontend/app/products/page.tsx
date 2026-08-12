"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductBrowser } from "@/components/customer/ProductBrowser";
import { LoadingState } from "@/components/customer/StateBlock";

function ProductsPageContent() {
  const searchParams = useSearchParams();
  // `category` is the long-standing param name; `categoryId` matches the API
  // and the rest of the hierarchy, so both are accepted.
  const category = searchParams.get("categoryId") ?? searchParams.get("category");
  const companyId = searchParams.get("companyId");
  const productTypeId = searchParams.get("productTypeId");
  const modelId = searchParams.get("modelId");
  const search = searchParams.get("search");

  return (
    <ProductBrowser
      title="All Products"
      description={
        search ? `Results for “${search}”` : "Browse the full catalogue."
      }
      query={{
        categoryId: category || undefined,
        companyId: companyId || undefined,
        productTypeId: productTypeId || undefined,
        modelId: modelId || undefined,
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
