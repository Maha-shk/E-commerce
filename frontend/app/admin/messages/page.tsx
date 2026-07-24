"use client";

import { useState, useEffect } from "react";
import { Search, MessagesSquare, X } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/select-native";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ConversationCard } from "@/components/admin/ConversationCard";
import { ChatHeader } from "@/components/admin/ChatHeader";
import { ChatBubble } from "@/components/admin/ChatBubble";
import { CustomerInfoCard } from "@/components/admin/CustomerInfoCard";
import { EmptyState } from "@/components/admin/EmptyState";
import {
  useConversations,
  useConversation,
  useSendMessage,
} from "@/lib/hooks/use-admin";
import {
  type Conversation as APIConversation,
  type ConversationDetail as APIConversationDetail,
} from "@/lib/api/models";
import { formatDate } from "@/lib/admin/format";

// Type compatibility layer for components
export type { Conversation, ChatMessage, MessageDirection, PresenceStatus, ConversationOrderStatus, ConversationOrder } from "@/lib/admin/messages";

/**
 * Transform API Conversation to component format.
 */
function transformConversation(
  apiConv: APIConversation,
): Parameters<typeof ConversationCard>[0]["conversation"] {
  return {
    id: apiConv.id,
    customer: apiConv.customer,
    lastMessage: apiConv.lastMessage,
    lastMessageAt: apiConv.lastMessageAt,
    unread: apiConv.unread,
  };
}

/**
 * Transform API ConversationDetail to component format.
 */
function transformConversationDetail(apiDetail: APIConversationDetail): Parameters<typeof CustomerInfoCard>[0]["conversation"] {
  // Return the API detail directly - components expect the API format
  return apiDetail as any;
}

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(true);

  // Persist customer details visibility in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_show_customer_details');
    if (saved !== null) {
      setShowCustomerDetails(saved === 'true');
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('admin_show_customer_details', String(showCustomerDetails));
  }, [showCustomerDetails]);

  const { data: conversationsData } = useConversations({
    search: search || undefined,
  });
  const { data: selectedData } = useConversation(selectedId);
  const sendMessage = useSendMessage();

  const conversations = conversationsData?.data ?? [];
  const totalCount = conversationsData?.meta.total ?? 0;

  // Auto-select first conversation on load
  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  const selected = selectedData ? transformConversationDetail(selectedData) : null;
  const transformedConversations = conversations.map(transformConversation);

  function handleSend(text: string) {
    if (!selectedId) return;
    sendMessage.mutate({ id: selectedId, text });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="Customer support chat and real-time messaging."
        action={
          <div className="flex items-center gap-2">
            <span className="text-sm text-subtle">
              {totalCount} conversations
            </span>
          </div>
        }
      />

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            type="search"
            placeholder="Search by customer name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-lg bg-card pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <NativeSelect
            aria-label="Filter by status"
            className="w-auto min-w-36"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </NativeSelect>
        </div>
      </div>

      <div className={`grid gap-6 transition-all duration-300 ${
        showCustomerDetails ? 'lg:grid-cols-[350px_1fr_350px]' : 'lg:grid-cols-[350px_1fr]'
      }`}>
        {/* Conversation list */}
        <Card className="h-[700px] overflow-y-auto">
          <div className="divide-y">
            {transformedConversations.map((conv) => (
              <ConversationCard
                key={conv.id}
                conversation={conv}
                active={selectedId === conv.id}
                onSelect={() => {
                  setSelectedId(conv.id);
                  setShowCustomerDetails(true);
                }}
              />
            ))}
            {transformedConversations.length === 0 && (
              <EmptyState
                icon={MessagesSquare}
                title="No conversations yet"
                description={search ? "No conversations match your search." : "Start chatting with customers!"}
              />
            )}
          </div>
        </Card>

        {/* Chat window */}
        <Card className="h-[700px] flex flex-col">
          {selected ? (
            <>
              <ChatHeader
                conversation={selected}
                onBack={() => setSelectedId(null)}
                onOpenDetails={() => setShowCustomerDetails(!showCustomerDetails)}
              />

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selected.messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}

                {selected.messages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground text-sm">No messages yet</p>
                  </div>
                )}
              </div>

              <div className="border-t p-4">
                <MessageInputWrapper
                  onSend={handleSend}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={MessagesSquare}
                title="No conversation selected"
                description="Select a conversation to start chatting"
              />
            </div>
          )}
        </Card>

        {/* Customer details panel (desktop) */}
        {selected && showCustomerDetails && (
          <Card className="h-[700px] overflow-y-auto relative">
            <button
              onClick={() => setShowCustomerDetails(false)}
              className="absolute top-4 right-4 z-10 rounded-md p-2 hover:bg-muted transition-colors"
              aria-label="Close customer details"
            >
              <X className="size-4" />
            </button>
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Customer Details</h3>
              </div>
              <CustomerInfoCard conversation={selected} />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function MessageInputWrapper({
  onSend,
}: {
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (text.trim()) {
      onSend(text);
      setText("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="text"
        placeholder="Type a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" size="xl" disabled={!text.trim()}>
        Send
      </Button>
    </form>
  );
}
