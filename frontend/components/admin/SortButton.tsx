import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select-native";

/**
 * Table sort control with configurable sort options.
 * `size` adapts the button to sit alongside a table's existing toolbar controls.
 */
export function SortButton({
  size = "icon-lg",
  className,
  options,
  value,
  onChange,
  iconOnly = false,
}: {
  size?: "icon-sm" | "icon" | "icon-lg";
  className?: string;
  options?: Array<{ value: string; label: string }>;
  value?: { sortBy: string; sortOrder: 'asc' | 'desc' };
  onChange?: (value: { sortBy: string; sortOrder: 'asc' | 'desc' }) => void;
  iconOnly?: boolean;
}) {
  // If no options provided, don't render anything (backward compatibility)
  if (!options || !onChange) {
    return (
      <Button variant="outline" size={size} aria-label="Sort" className={className}>
        <ArrowUpDown className="size-4" />
      </Button>
    );
  }

  const currentSortOrder = value?.sortOrder || 'desc';

  if (iconOnly) {
    return (
      <Button
        variant="outline"
        size={size}
        aria-label="Toggle sort order"
        className={className}
        onClick={() => {
          if (value) {
            onChange({
              sortBy: value.sortBy,
              sortOrder: currentSortOrder === 'desc' ? 'asc' : 'desc',
            });
          }
        }}
      >
        {currentSortOrder === 'desc' ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}
      </Button>
    );
  }

  return (
    <NativeSelect
      aria-label="Sort by"
      className="w-auto min-w-40"
      value={value ? value.sortBy + '-' + value.sortOrder : ''}
      onChange={(e) => {
        const [sortBy, sortOrder] = e.target.value.split('-') as [string, 'asc' | 'desc'];
        if (sortBy && sortOrder) {
          onChange({ sortBy, sortOrder });
        }
      }}
    >
      {options.map((option) => {
        const descKey = option.value + '-desc';
        const ascKey = option.value + '-asc';
        const descValue = option.value + '-desc';
        const ascValue = option.value + '-asc';

        return (
          <div key={option.value}>
            <option key={descKey} value={descValue}>
              {option.label} (High to Low)
            </option>
            <option key={ascKey} value={ascValue}>
              {option.label} (Low to High)
            </option>
          </div>
        );
      })}
    </NativeSelect>
  );
}
