"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronRight, PackageX } from "lucide-react";
import { CustomerPageShell } from "@/components/customer/CustomerPageShell";
import { ProductGallery } from "@/components/customer/ProductGallery";
import { ProductInfo } from "@/components/customer/ProductInfo";
import { RelatedProducts } from "@/components/customer/RelatedProducts";
import { EmptyState, ErrorState, LoadingState } from "@/components/customer/StateBlock";
import { Button } from "@/components/ui/button";
import { useProduct } from "@/lib/hooks/use-customer";

/** Breadcrumb trail — the page previously gave no sense of where you were. */
function Breadcrumbs({
  category,
  name,
}: {
  category: { name: string; slug: string } | null;
  name: string;
}) {
  const crumbClass =
    "rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        <li>
          <Link href="/products" className={crumbClass}>
            Products
          </Link>
        </li>
        {category ? (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
            <li>
              <Link href={`/categories/${category.slug}`} className={crumbClass}>
                {category.name}
              </Link>
            </li>
          </>
        ) : null}
        <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
        <li className="min-w-0 max-w-[16rem] truncate font-medium" aria-current="page">
          {name}
        </li>
      </ol>
    </nav>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const { data: product, isPending, isError, refetch } = useProduct(id);

  return (
    <CustomerPageShell>
      {isError ? (
        <ErrorState title="Couldn't load this product" onRetry={() => refetch()} />
      ) : isPending ? (
        <LoadingState label="Loading product…" />
      ) : !product ? (
        <EmptyState
          bordered
          icon={PackageX}
          title="Product not found"
          description="This product doesn't exist, or it's no longer available."
          action={
            <Button asChild variant="outline">
              <Link href="/products">Browse all products</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Breadcrumbs category={product.category} name={product.name} />

          <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery images={product.images ?? []} />
            <ProductInfo product={product} />
          </div>

          <div className="mt-16">
            <RelatedProducts
              categoryId={product.categoryId}
              currentProductId={product.id}
              categoryName={product.category?.name}
            />
          </div>
        </>
      )}
    </CustomerPageShell>
  );
}
