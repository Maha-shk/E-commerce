"use client";

import { settingsNavItems } from "@/lib/admin/settings";
import { cn } from "@/lib/utils";

/**
 * Settings section switcher.
 *
 * Was a list of `#anchor` links into a page that rendered all fifteen sections
 * at once. Now it selects which single section is shown, so the page is a
 * focused panel rather than a very long scroll — and the current section is
 * actually indicated, which anchor links never did.
 */
export function SettingsNav({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {/* Desktop: sticky vertical list */}
      <nav
        aria-label="Settings sections"
        className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] w-56 shrink-0 overflow-y-auto xl:block"
      >
        <ul className="space-y-0.5 border-l border-border">
          {settingsNavItems.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "-ml-px block w-full border-l-2 px-4 py-1.5 text-left text-sm transition-colors",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    isActive
                      ? "border-primary font-medium text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Tablet / mobile: horizontal chip row */}
      <nav
        aria-label="Settings sections"
        className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 xl:hidden"
      >
        {settingsNavItems.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
