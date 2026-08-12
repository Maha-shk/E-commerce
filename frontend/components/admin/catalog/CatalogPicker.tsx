"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select-native";
import { useCatalogList } from "@/lib/hooks/use-catalog";
import {
  CATALOG_LEVELS,
  catalogLevelHref,
  type BreadcrumbEntry,
  type CatalogSegment,
} from "@/lib/api/catalog";

/**
 * Four dependent selects that resolve down to a single `modelId`.
 *
 * A product no longer picks a category — it attaches to a Model, and the
 * Category, Company and Product Type are implied by where that Model sits.
 * So the form walks the hierarchy and submits only the leaf.
 *
 * Each level is fetched with `withCounts=false`: a picker never shows the
 * product roll-up, and asking for it costs extra queries per option.
 */

const [CATEGORY, COMPANY, PRODUCT_TYPE, MODEL] = CATALOG_LEVELS;

type Selection = {
  categoryId: string;
  companyId: string;
  productTypeId: string;
  modelId: string;
};

/** Seeds all four selects from a product's breadcrumb when editing. */
function selectionFromBreadcrumb(trail?: BreadcrumbEntry[]): Selection {
  const find = (level: BreadcrumbEntry["level"]) =>
    trail?.find((crumb) => crumb.level === level)?.id ?? "";

  return {
    categoryId: find("CATEGORY"),
    companyId: find("COMPANY"),
    productTypeId: find("PRODUCT_TYPE"),
    modelId: find("MODEL"),
  };
}

export function CatalogPicker({
  value,
  onChange,
  /** The product's existing trail, so an edit opens with all four filled in. */
  initialBreadcrumb,
  disabled,
}: {
  value: string;
  onChange: (modelId: string) => void;
  initialBreadcrumb?: BreadcrumbEntry[];
  disabled?: boolean;
}) {
  const [selection, setSelection] = useState<Selection>(() => {
    const seeded = selectionFromBreadcrumb(initialBreadcrumb);
    // `value` wins: the form owns the model id, this only pre-fills the path.
    return { ...seeded, modelId: value || seeded.modelId };
  });

  const categories = useCatalogList(CATEGORY.segment, listParams());
  const companies = useCatalogList(
    COMPANY.segment,
    listParams(selection.categoryId),
    { enabled: Boolean(selection.categoryId) },
  );
  const productTypes = useCatalogList(
    PRODUCT_TYPE.segment,
    listParams(selection.companyId),
    { enabled: Boolean(selection.companyId) },
  );
  const models = useCatalogList(
    MODEL.segment,
    listParams(selection.productTypeId),
    { enabled: Boolean(selection.productTypeId) },
  );

  /**
   * Changing a level invalidates everything below it — a company from another
   * category would be a parent mismatch the server answers 404 to, so the
   * stale ids are cleared rather than submitted.
   */
  function select(next: Partial<Selection>) {
    setSelection((current) => {
      const merged: Selection = { ...current, ...next };

      if (next.categoryId !== undefined) {
        merged.companyId = "";
        merged.productTypeId = "";
        merged.modelId = "";
      } else if (next.companyId !== undefined) {
        merged.productTypeId = "";
        merged.modelId = "";
      } else if (next.productTypeId !== undefined) {
        merged.modelId = "";
      }

      onChange(merged.modelId);
      return merged;
    });
  }

  const noCategories =
    !categories.isPending && (categories.data?.data.length ?? 0) === 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <PickerSelect
          id="picker-category"
          label={CATEGORY.label}
          value={selection.categoryId}
          options={categories.data?.data}
          loading={categories.isPending}
          onChange={(categoryId) => select({ categoryId })}
          disabled={disabled}
        />

        <PickerSelect
          id="picker-company"
          label={COMPANY.label}
          hint="The brand"
          value={selection.companyId}
          options={companies.data?.data}
          loading={companies.isFetching}
          onChange={(companyId) => select({ companyId })}
          disabled={disabled || !selection.categoryId}
          waitingFor={CATEGORY.label}
        />

        <PickerSelect
          id="picker-product-type"
          label={PRODUCT_TYPE.label}
          value={selection.productTypeId}
          options={productTypes.data?.data}
          loading={productTypes.isFetching}
          onChange={(productTypeId) => select({ productTypeId })}
          disabled={disabled || !selection.companyId}
          waitingFor={COMPANY.label}
        />

        <PickerSelect
          id="picker-model"
          label={MODEL.label}
          hint="The product attaches here"
          value={selection.modelId}
          options={models.data?.data}
          loading={models.isFetching}
          onChange={(modelId) => select({ modelId })}
          disabled={disabled || !selection.productTypeId}
          waitingFor={PRODUCT_TYPE.label}
        />
      </div>

      {noCategories ? (
        <EmptyCatalogNotice segment={CATEGORY.segment} />
      ) : selection.productTypeId &&
        !models.isFetching &&
        (models.data?.data.length ?? 0) === 0 ? (
        <EmptyCatalogNotice
          segment={MODEL.segment}
          message="This product type has no models yet, and a product has to attach to one."
        />
      ) : null}
    </div>
  );
}

/** Pickers never need the product roll-up, and it costs extra queries. */
function listParams(parentId?: string) {
  return {
    parentId,
    limit: 100,
    withCounts: false,
    sortBy: "name" as const,
    sortOrder: "asc" as const,
  };
}

function PickerSelect({
  id,
  label,
  hint,
  value,
  options,
  loading,
  onChange,
  disabled,
  waitingFor,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  options?: { id: string; name: string }[];
  loading: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** The level that has to be chosen first, named in the placeholder. */
  waitingFor?: string;
}) {
  const placeholder = disabled && waitingFor
    ? `Choose a ${waitingFor.toLowerCase()} first`
    : loading
      ? "Loading…"
      : `Select ${label.toLowerCase()}…`;

  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-xs font-semibold tracking-wider text-subtle uppercase"
      >
        {label}
      </Label>
      <NativeSelect
        id={id}
        className="h-11 rounded-lg bg-card"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {(options ?? []).map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </NativeSelect>
      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

function EmptyCatalogNotice({
  segment,
  message = "There are no categories yet, and every product needs a place in the hierarchy.",
}: {
  segment: CatalogSegment;
  message?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-warning-muted p-3.5 text-sm text-warning">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1.5">
        <p>{message}</p>
        <Link
          href={catalogLevelHref(segment)}
          className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
        >
          Open the catalogue
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
