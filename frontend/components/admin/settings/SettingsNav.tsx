import { settingsNavItems } from "@/lib/admin/settings";

/**
 * In-page settings navigation. Plain anchor links — no JS required, so this
 * stays a Server Component. Renders as a sticky vertical list on large
 * screens and a horizontal scrollable chip row below that.
 */
export function SettingsNav() {
  return (
    <>
      {/* Desktop: sticky vertical list */}
      <nav className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] w-56 shrink-0 overflow-y-auto xl:block">
        <ul className="space-y-0.5 border-l">
          {settingsNavItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="-ml-px block border-l-2 border-transparent px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Tablet / mobile: horizontal chip row */}
      <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 xl:hidden">
        {settingsNavItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </a>
        ))}
      </nav>
    </>
  );
}
