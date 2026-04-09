"use client";

import dynamic from "next/dynamic";

export const ChatWidgetLoader = dynamic(
  () => import("@/components/chat/chat-widget").then((mod) => mod.ChatWidget),
  {
    ssr: false,
  }
);
