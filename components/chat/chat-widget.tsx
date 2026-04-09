"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/lib/store";

export function ChatWidget() {
  const { isOpen, messages, toggleChat, addMessage, visitorId } = useChatStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage({
        role: "assistant",
        content:
          "Hi there! Welcome to Muskingum Materials. I can help you with product information, pricing, delivery questions, or anything else. What can I help you with today?",
      });
    }
  }, [isOpen, messages.length, addMessage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    addMessage({ role: "user", content: trimmed });
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          visitorId,
          history: messages.slice(-10),
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const data = await response.json();
      addMessage({ role: "assistant", content: data.reply });

      if (messages.length >= 4 && !contactSubmitted && !showContactForm) {
        setShowContactForm(true);
      }
    } catch {
      addMessage({
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please call us at (740) 319-0183 or email sales@muskingummaterials.com for immediate assistance.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...contactInfo,
          source: "chat",
          visitorId,
        }),
      });
      setContactSubmitted(true);
      setShowContactForm(false);
      addMessage({
        role: "assistant",
        content: `Thanks${contactInfo.name ? `, ${contactInfo.name}` : ""}! We have your info and will follow up if needed. How else can I help?`,
      });
    } catch {
      setShowContactForm(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={toggleChat}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:scale-105 transition-all"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] rounded-xl border bg-background shadow-2xl flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between p-4 border-b bg-primary text-white rounded-t-xl">
            <div>
              <p className="font-semibold text-sm">Muskingum Materials</p>
              <p className="text-xs opacity-90">Ask us anything!</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChat}
              className="text-white hover:bg-white/20 h-8 w-8"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4 min-h-0 max-h-[400px]" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {showContactForm && !contactSubmitted && (
              <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                <p className="text-xs font-medium mb-2">
                  Want us to follow up? Leave your info (optional):
                </p>
                <form onSubmit={handleContactSubmit} className="space-y-2">
                  <Input
                    placeholder="Name"
                    value={contactInfo.name}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, name: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, email: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Phone"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, phone: e.target.value })
                    }
                    className="h-8 text-xs"
                  />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" className="text-xs h-7">
                      Submit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => {
                        setShowContactForm(false);
                        setContactSubmitted(true);
                      }}
                    >
                      Skip
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-3 border-t flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 h-9 text-sm"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
