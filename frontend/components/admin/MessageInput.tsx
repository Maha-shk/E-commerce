import { Paperclip, Smile, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Chat composer — purely presentational. The field is uncontrolled and the
 * send button has no handler; messaging is wired up in a later phase.
 */
export function MessageInput() {
  return (
    <div className="flex items-center gap-2 border-t p-3">
      <Button variant="ghost" size="icon" aria-label="Attach file" className="shrink-0 text-subtle">
        <Paperclip className="size-5" />
      </Button>
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Type a message…"
          aria-label="Message"
          className="h-11 rounded-full bg-muted/40 pr-10 pl-4"
        />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Add emoji"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-subtle"
        >
          <Smile className="size-5" />
        </Button>
      </div>
      <Button size="icon" aria-label="Send message" className="size-11 shrink-0 rounded-full">
        <Send className="size-5" />
      </Button>
    </div>
  );
}
