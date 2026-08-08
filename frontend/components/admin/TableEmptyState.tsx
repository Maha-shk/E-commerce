import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";

/**
 * Full-width empty row inside an admin table.
 *
 * The tables previously rendered a bare icon plus one grey line ("No products
 * match your filters.") with no way forward — and crucially, they rendered the
 * SAME message whether the list was genuinely empty or the request had failed.
 */
export function TableEmptyState({
  colSpan,
  icon: Icon,
  title,
  description,
  action,
}: {
  colSpan: number;
  icon: ComponentType<LucideProps>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-16 text-center">
        <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" aria-hidden />
        </span>
        <p className="text-base font-semibold tracking-tight text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
        {action ? <div className="mt-5 flex justify-center gap-2">{action}</div> : null}
      </td>
    </tr>
  );
}
