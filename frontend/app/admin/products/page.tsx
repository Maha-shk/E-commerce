import { ProductsScreen } from "@/components/admin/products/ProductsScreen";

/**
 * The products table, optionally scoped to a node in the catalogue.
 *
 * `?categoryId=`, `?companyId=`, `?productTypeId=` and `?modelId=` all arrive
 * from the catalogue — a node's product count links here, and so does the
 * "review these products" way out of a blocked delete. Reading them on the
 * server keeps the screen out of a Suspense boundary.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    categoryId?: string;
    companyId?: string;
    productTypeId?: string;
    modelId?: string;
  }>;
}) {
  const scope = await searchParams;

  return (
    <ProductsScreen
      // A different scope is a different starting filter set, and the screen
      // holds those in state — remount rather than ignore the new link.
      key={`${scope.categoryId ?? ""}|${scope.companyId ?? ""}|${scope.productTypeId ?? ""}|${scope.modelId ?? ""}`}
      scope={scope}
    />
  );
}
