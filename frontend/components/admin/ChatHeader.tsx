import { ChevronLeft, Phone, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusDot } from "@/components/admin/StatusDot";
import type { ConversationDetail } from "@/lib/api/models";

/** Chat window header: customer identity, presence, and quick actions. */
export function ChatHeader({
  conversation,
  onBack,
  onOpenDetails,
}: {
  conversation: ConversationDetail;
  /** Return to the list (mobile). */
  onBack?: () => void;
  /** Open the customer details panel (tablet / mobile). */
  onOpenDetails?: () => void;
}) {
  const { customer } = conversation;

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

      <Avatar className="size-10">
        <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
          {customer.initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <button
          onClick={onOpenDetails}
          className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer text-left"
          title="View customer details"
        >
          {customer.fullName}
        </button>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <StatusDot tone="success" className="size-1.5" />
          Active now
        </p>
      </div>

      <div className="flex items-center gap-1">
        {customer.phone && (
          <a
            href={`tel:${customer.phone}`}
            className="rounded-lg p-2 hover:bg-muted"
            aria-label="Call customer"
          >
            <Phone className="size-4 text-subtle" />
          </a>
        )}
        <Button variant="ghost" size="icon-sm" aria-label="More options">
          <MoreVertical />
        </Button>
      </div>
    </div>
  );
}
