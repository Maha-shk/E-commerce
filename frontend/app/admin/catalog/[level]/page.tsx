import { notFound } from "next/navigation";
import { CatalogLevelScreen } from "@/components/admin/catalog/CatalogLevelScreen";
import { isCatalogSegment, levelForSegment } from "@/lib/api/catalog";

/**
 * One screen for all four levels — the segment picks which.
 *
 * `?isPlaceholder=true` opens it scoped to the nodes the migration invented,
 * which is where the overview's "needs filing" banner points. Read on the
 * server so the screen itself stays outside a Suspense boundary.
 */
export default async function CatalogLevelPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string }>;
  searchParams: Promise<{ isPlaceholder?: string }>;
}) {
  const { level: segment } = await params;
  if (!isCatalogSegment(segment)) notFound();

  const { isPlaceholder } = await searchParams;
  const initialFiling =
    isPlaceholder === "true" ? "true" : isPlaceholder === "false" ? "false" : "All";

  return (
    <CatalogLevelScreen
      // The level and the incoming filter are both initial state, so a link to
      // a different one has to remount rather than be ignored.
      key={`${segment}:${initialFiling}`}
      level={levelForSegment(segment)!}
      initialFiling={initialFiling}
    />
  );
}
