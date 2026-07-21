"use client";

import { useState } from "react";
import { Search, MessagesSquare } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select-native";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ConversationCard } from "@/components/admin/ConversationCard";
import { ChatHeader } from "@/components/admin/ChatHeader";
import { ChatBubble } from "@/components/admin/ChatBubble";
import { MessageInput } from "@/components/admin/MessageInput";
import { CustomerInfoCard } from "@/components/admin/CustomerInfoCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { conversations } from "@/lib/admin/messages";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        subtitle="View, organize, and manage customer conversations from one place."
      />

      <div className="flex h-[calc(100dvh-13rem)] min-h-125 gap-4">
        {/* Conversation list */}
        <Card
          className={cn(
            "flex w-full flex-col gap-0 py-0 lg:w-80 xl:w-88",
            selected && "hidden lg:flex",
          )}
        >
          <div className="shrink-0 space-y-2.5 border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                type="search"
                placeholder="Search conversations…"
                aria-label="Search conversations"
                className="h-10 rounded-lg bg-muted/40 pl-9"
              />
            </div>
            <NativeSelect aria-label="Filter conversations" className="h-9" defaultValue="All">
              <option value="All">All conversations</option>
              <option value="Unread">Unread</option>
              <option value="Online">Online</option>
            </NativeSelect>
          </div>

          <div className="flex-1 divide-y overflow-y-auto">
            {conversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === selectedId}
                onSelect={() => setSelectedId(conversation.id)}
              />
            ))}
          </div>
        </Card>

        {/* Chat window */}
        <Card className={cn("flex flex-1 flex-col gap-0 py-0", !selected && "hidden lg:flex")}>
          {selected ? (
            <>
              <ChatHeader
                conversation={selected}
                onBack={() => setSelectedId(null)}
                onOpenDetails={() => setDetailsOpen(true)}
              />
              <div className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4">
                {selected.messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </div>
              <MessageInput />
            </>
          ) : (
            <EmptyState
              icon={MessagesSquare}
              title="Select a conversation"
              description="Choose a conversation from the list to view the message history and reply."
              className="m-auto"
            />
          )}
        </Card>

        {/* Customer details — desktop column */}
        {selected && (
          <div className="hidden w-88 shrink-0 overflow-y-auto xl:block">
            <CustomerInfoCard conversation={selected} />
          </div>
        )}
      </div>

      {/* Customer details — tablet / mobile drawer */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-4 sm:max-w-sm">
          <SheetTitle className="sr-only">Customer details</SheetTitle>
          {selected && <CustomerInfoCard conversation={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
