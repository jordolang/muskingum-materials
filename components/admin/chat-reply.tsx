"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { useToast } from "@/lib/use-toast";

interface ChatReplyProps {
  conversationId: string;
  hasEmail: boolean;
  hasPhone: boolean;
}

export function ChatReply({ conversationId, hasEmail, hasPhone }: ChatReplyProps) {
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<"email" | "sms">(hasEmail ? "email" : "sms");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Determine available methods
  const canSendEmail = hasEmail;
  const canSendSMS = hasPhone;
  const canReply = canSendEmail || canSendSMS;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/chats/${conversationId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          replyMessage: message.trim(),
          method
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reply");
      }

      // Success
      toast({
        title: "Reply sent",
        description: `Your message was sent via ${method === "email" ? "email" : "SMS"}`,
      });

      // Clear form
      setMessage("");

      // Refresh the page to show the new message
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
      toast({
        title: "Failed to send reply",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!canReply) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        No contact information available. Customer needs to provide email or phone to receive replies.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="message">Reply Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your reply message here..."
          rows={4}
          disabled={isSubmitting}
          className="mt-2"
        />
      </div>

      {canSendEmail && canSendSMS && (
        <div>
          <Label htmlFor="method">Send via</Label>
          <Select
            value={method}
            onValueChange={(value) => setMethod(value as "email" | "sms")}
            disabled={isSubmitting}
          >
            <SelectTrigger id="method" className="mt-2">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!canSendEmail && canSendSMS && (
        <p className="text-sm text-muted-foreground">
          Will be sent via SMS (no email available)
        </p>
      )}

      {canSendEmail && !canSendSMS && (
        <p className="text-sm text-muted-foreground">
          Will be sent via email (no phone available)
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || !message.trim()}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Reply
          </>
        )}
      </Button>
    </form>
  );
}
