import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getCategoryById } from "@/lib/admin/categories";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = getCategoryById(id);

  if (!category) notFound();

  return <CategoryForm mode="edit" category={category} />;
}
