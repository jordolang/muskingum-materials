"use client";

import dynamic from "next/dynamic";

export const ChatWidgetLoader = dynamic(
  () => import("@/components/chat/chat-widget").then((mod) => mod.ChatWidget),
  {
    ssr: false,
    loading: () => (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
      </div>
    ),
  }
);
