"use client";

import { ChatPane } from "@/components/analytics/chat-pane";
import { ConversationList } from "@/components/analytics/conversation-list";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AnalyticsContent() {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("c");

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-slate-200 bg-white">
        <ConversationList activeId={conversationId} />
      </aside>
      <div className="min-w-0 flex-1">
        <ChatPane conversationId={conversationId} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-penguin-cool-gray">Cargando...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
