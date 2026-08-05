"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductGallery } from "@/components/customer/ProductGallery";
import { ProductInfo } from "@/components/customer/ProductInfo";
import { RelatedProducts } from "@/components/customer/RelatedProducts";
import { HomePageHeader } from "@/components/customer/HomePageHeader";
import { HomePageFooter } from "@/components/customer/HomePageFooter";
import { useProduct } from "@/lib/hooks/use-customer";
import { useCart } from "@/lib/hooks/use-cart";
import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/admin/QueryState";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setId(params.id as string);
  }, [params]);

  const { data: product, isLoading, isError, error } = useProduct(id ?? "");
  const { totalItems } = useCart();

  if (!id) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
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
          The product you're looking for doesn't exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <HomePageHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        cartCount={totalItems}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Product Detail Section */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Gallery */}
          <ProductGallery images={product.images || []} />

          {/* Product Info */}
          <ProductInfo product={product} />
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />
        </div>
      </main>

      <HomePageFooter />
    </div>
  );
}
