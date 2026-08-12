"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/admin/ProductForm";
import { ErrorState } from "@/components/admin/QueryState";
import { useProduct } from "@/lib/hooks/use-admin";
import { getApiErrorStatus } from "@/lib/api/client";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  // `use` unwraps the params promise directly — the previous version resolved
  // it in an effect, which cost an extra render and a spinner on every visit.
  const { id } = use(params);

  const { data: product, isPending, isError, error } = useProduct(id);

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  /*
   * A product from another store answers 404, exactly as a deleted one does —
   * the API never returns 403 here, so ids cannot be probed across stores.
   * Either way there is nothing to retry.
   */
  if (isError && getApiErrorStatus(error) !== 404) {
    return <ErrorState error={error} onRetry={() => router.refresh()} />;
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <PackageX className="size-6" aria-hidden />
        </span>
        <div>
          <p className="text-base font-semibold text-foreground">Product not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            It has been deleted, or it belongs to a different store.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/products">Back to products</Link>
        </Button>
      </div>
    );
  }

  return <ProductForm mode="edit" product={product} />;
}
