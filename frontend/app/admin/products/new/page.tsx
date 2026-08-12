import { ProductForm } from "@/components/admin/ProductForm";

/**
 * `?modelId=` pre-fills the catalogue picker.
 *
 * "New Product" on a model's page arrives here already knowing where the
 * product belongs, so the four selects open filled in rather than making the
 * admin walk back down a tree they were just standing in.
 *
 * Read on the server rather than through `useSearchParams`, which would force
 * the whole form behind a Suspense boundary to stay prerenderable.
 */
export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ modelId?: string }>;
}) {
  const { modelId } = await searchParams;

  return <ProductForm mode="add" initialModelId={modelId} />;
}
