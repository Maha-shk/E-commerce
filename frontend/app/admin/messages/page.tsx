"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, MessagesSquare, X, Loader2, PanelRightClose, Send } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select-native";
import { ConversationCard } from "@/components/admin/ConversationCard";
import { ChatHeader } from "@/components/admin/ChatHeader";
import { ChatBubble } from "@/components/admin/ChatBubble";
import { CustomerInfoCard } from "@/components/admin/CustomerInfoCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { ErrorState } from "@/components/admin/QueryState";
import {
  useConversations,
  useConversation,
  useSendMessage,
} from "@/lib/hooks/use-admin";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [picked, setPicked] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const debouncedSearch = useDebounce(search);

  const {
    data: conversationsData,
    isPending,
    isError,
    error,
    refetch,
  } = useConversations({ search: debouncedSearch || undefined });

  /**
   * The status dropdown previously only set state — nothing read it, so
   * choosing "Unread" changed nothing. The API has no status filter, so it is
   * applied here against the unread counter the list already returns.
   */
  const conversations = useMemo(() => {
    const all = conversationsData?.data ?? [];
    if (status === "unread") return all.filter((c) => c.unread > 0);
    if (status === "read") return all.filter((c) => c.unread === 0);
    return all;
  }, [conversationsData, status]);

  /*
   * Selection is DERIVED: an explicit pick, otherwise the first conversation.
   *
   * This used to be an effect that called `setSelectedId` when nothing was
   * selected — an extra render on every load, and it re-fired whenever the
   * filtered list changed identity.
   */
  const activeId =
    (picked && conversations.some((c) => c.id === picked) ? picked : null) ??
    conversations[0]?.id ??
    null;

  const { data: selected, isPending: detailPending } = useConversation(activeId);
  const sendMessage = useSendMessage();

  // Keep the newest message in view — the thread used to open scrolled to the
  // top, so the most recent reply was the one you couldn't see.
  const scrollRef = useRef<HTMLDivElement>(null);
  const messageCount = selected?.messages.length ?? 0;

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [activeId, messageCount]);

  function handleSend(text: string) {
    if (!activeId) return;
    sendMessage.mutate({ id: activeId, text });
  }

  const totalCount = conversations.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Customer support conversations."
        action={
          <span className="text-sm text-subtle tabular-nums">
            {totalCount} {totalCount === 1 ? "conversation" : "conversations"}
          </span>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle"
            aria-hidden
          />
          <Input
            type="text"
            inputMode="search"
            aria-label="Search conversations"
            placeholder="Search by customer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            // Was h-11 beside an h-9 select.
            className={cn("h-10 bg-card pl-9", search && "pr-9")}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <NativeSelect
          aria-label="Filter by read state"
          className="h-10 w-auto min-w-36"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All conversations</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </NativeSelect>
      </div>

      {isError ? (
        <Card className="gap-0 py-0">
          <div className="p-5">
            <ErrorState error={error} onRetry={() => refetch()} />
          </div>
        </Card>
      ) : (
        <div
          className={cn(
            "grid gap-6 transition-all duration-300",
            showDetails
              ? "lg:grid-cols-[340px_1fr_320px]"
              : "lg:grid-cols-[340px_1fr]",
          )}
        >
          {/* Conversation list. Heights are viewport-relative — they were a
              fixed 700px, which overflowed short laptops and left a dead band
              on tall monitors. */}
          <Card className="h-[min(70vh,700px)] gap-0 overflow-y-auto py-0">
            {isPending ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={MessagesSquare}
                title="No conversations"
                description={
                  search ? "No conversations match your search." : "Nothing here yet."
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {conversations.map((conversation) => (
                  <ConversationCard
                    key={conversation.id}
                    conversation={conversation}
                    active={activeId === conversation.id}
                    onSelect={() => setPicked(conversation.id)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Chat */}
          <Card className="flex h-[min(70vh,700px)] flex-col gap-0 py-0">
            {detailPending && activeId ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : selected ? (
              <>
                <ChatHeader
                  conversation={selected}
                  onBack={() => setPicked(null)}
                  onOpenDetails={() => setShowDetails((v) => !v)}
                />

                <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                  {selected.messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-muted-foreground">No messages yet</p>
                    </div>
                  ) : (
                    selected.messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
                  )}
                </div>

                <div className="border-t border-border p-4">
                  <MessageComposer onSend={handleSend} isSending={sendMessage.isPending} />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  icon={MessagesSquare}
                  title="No conversation selected"
                  description="Pick a conversation to start replying."
                />
              </div>
            )}
          </Card>

          {/* Customer details */}
          {selected && showDetails ? (
            <Card className="hidden h-[min(70vh,700px)] gap-0 overflow-y-auto py-0 lg:block">
              <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
                <h2 className="text-base font-semibold tracking-tight">Customer</h2>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDetails(false)}
                  aria-label="Hide customer details"
                >
                  <PanelRightClose className="size-4" aria-hidden />
                </Button>
              </div>
              <div className="p-5">
                {/* `transformConversationDetail` used to cast this through
                    `as any` — but ChatHeader and CustomerInfoCard both already
                    take `ConversationDetail`, so the cast was covering a
                    mismatch that didn't exist. */}
                <CustomerInfoCard conversation={selected} />
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  );
}

function MessageComposer({
  onSend,
  isSending,
}: {
  onSend: (text: string) => void;
  isSending: boolean;
}) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || isSending) return;
    onSend(value);
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        aria-label="Message"
        placeholder="Type a reply…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isSending}
        className="h-10 flex-1"
      />
      {/* Was `size="xl"` next to a default-height input, and had no pending
          state — you could fire the same reply repeatedly. */}
      <Button type="submit" disabled={!text.trim() || isSending}>
        {isSending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        Send
      </Button>
    </form>
  );
}
