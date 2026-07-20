import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductById } from "@/lib/admin/products";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) notFound();

  return <ProductForm mode="edit" product={product} />;
}
