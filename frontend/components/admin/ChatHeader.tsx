import { ChevronLeft, Info, Phone, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/admin/StatusDot";
import type { Conversation } from "@/lib/admin/messages";

/** Chat window header: customer identity, presence, and quick actions. */
export function ChatHeader({
  conversation,
  onBack,
  onOpenDetails,
}: {
  conversation: Conversation;
  /** Return to the list (mobile). */
  onBack?: () => void;
  /** Open the customer details panel (tablet / mobile). */
  onOpenDetails?: () => void;
}) {
  const { customer, presence } = conversation;

  return (
    <div className="flex items-center gap-3 border-b px-4 py-3">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        aria-label="Back to conversations"
        onClick={onBack}
      >
        <ChevronLeft />
      </Button>

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

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-foreground">{customer.name}</p>
        <p className="flex items-center gap-1.5 text-xs text-subtle">
          <StatusDot tone={presence === "online" ? "online" : "offline"} className="size-1.5" />
          {presence === "online" ? "Online" : "Offline"}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Call customer" className="hidden sm:inline-flex">
          <Phone />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="xl:hidden"
          aria-label="Customer details"
          onClick={onOpenDetails}
        >
          <Info />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="More options">
          <MoreVertical />
        </Button>
      </div>
    </div>
  );
}
