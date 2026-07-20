import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusDot } from "@/components/admin/StatusDot";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/admin/messages";

/** A single row in the conversation list. */
export function ConversationCard({
  conversation,
  active = false,
  onSelect,
}: {
  conversation: Conversation;
  active?: boolean;
  onSelect?: () => void;
}) {
  const { customer, presence, lastMessage, time, unread } = conversation;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-l-2 px-4 py-3.5 text-left outline-none transition-colors focus-visible:bg-muted/60",
        active
          ? "border-primary bg-accent"
          : "border-transparent hover:bg-muted/40",
      )}
    >
      <span className="relative shrink-0">
        <Avatar className="size-10">
          <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
            {customer.initials}
          </AvatarFallback>
        </Avatar>
        {presence === "online" && (
          <StatusDot tone="online" ring className="absolute bottom-0 right-0" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-foreground">{customer.name}</span>
          <span className="shrink-0 text-xs text-subtle">{time}</span>
        </span>
        <span className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              unread > 0 ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {lastMessage}
          </span>
          {unread > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground">
              {unread}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
