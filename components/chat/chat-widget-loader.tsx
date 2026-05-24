"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "@/lib/store";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () => import("@/components/chat/chat-widget").then((mod) => mod.ChatWidget),
  { ssr: false }
);

export function ChatWidgetLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const { openChat } = useChatStore();

  const handleClick = () => {
    setIsLoaded(true);
    openChat();
  };

  if (!isLoaded) {
    return (
      <Button
        onClick={handleClick}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-all"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return <ChatWidget />;
}
