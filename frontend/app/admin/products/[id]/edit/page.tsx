"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";
import { useProduct } from "@/lib/hooks/use-admin";
import { ErrorState } from "@/components/admin/QueryState";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id: productId }) => setId(productId));
  }, [params]);

  const { data: product, isLoading, isError, error } = useProduct(id ?? "");

  if (!id) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => router.refresh()} />;
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg font-semibold text-foreground">Product not found</p>
        <p className="text-sm text-muted-foreground">
          The product you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
      </div>
    );
  }

  return <ProductForm mode="edit" product={product} />;
}
