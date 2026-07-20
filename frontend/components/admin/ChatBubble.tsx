import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/admin/messages";

/** A single chat message bubble. Outgoing = navy/right, incoming = muted/left. */
export function ChatBubble({ message }: { message: ChatMessage }) {
  const outgoing = message.direction === "outgoing";

  return (
    <div className={cn("flex flex-col gap-1", outgoing ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[75%]",
          outgoing
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        {message.text}
      </div>
      <span className="px-1 text-xs text-subtle">{message.time}</span>
    </div>
  );
}
