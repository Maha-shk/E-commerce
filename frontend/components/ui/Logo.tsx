import Image from "next/image";
import { cn } from "@/lib/utils";

/** CENTO SERVIZI wordmark, served from /public/logos. */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/logos/cento-logo.png"
      alt="CENTO Servizi"
      width={150}
      height={59}
      priority
      className={cn("h-9 w-auto", className)}
    />
  );
}
