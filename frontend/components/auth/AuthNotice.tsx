import type { ReactNode } from "react";
import { Info } from "lucide-react";

/**
 * Inline note on an auth screen — currently the "you were sent here from
 * checkout" prompt.
 *
 * Replaces three copies of a hand-rolled banner using hardcoded Tailwind
 * palette colours (`bg-blue-50 border-blue-200 text-blue-800`) with a 🔔 emoji
 * standing in for an icon. The `info` tokens already exist for exactly this.
 */
export function AuthNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="mt-5 flex items-start gap-2.5 rounded-lg bg-info-muted p-3 text-sm text-info"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{children}</p>
    </div>
  );
}
