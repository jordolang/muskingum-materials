import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ChatMessage {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface ChatConversation {
  id: string;
  visitorId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  metadata: unknown;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatsTableProps {
  chats: ChatConversation[];
}

export function ChatsTable({ chats }: ChatsTableProps) {
  if (chats.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <MessageSquare className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No chat conversations found</h2>
          <p className="text-muted-foreground">
            Chat conversations will appear here as visitors engage.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {chats.map((chat) => {
        const messageCount = chat.messages.length;
        const lastMessage = chat.messages[messageCount - 1];
        const lastMessagePreview = lastMessage
          ? lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? "..." : "")
          : "No messages";

        return (
          <Link key={chat.id} href={`/admin/chats/${chat.id}`}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold font-mono text-sm">
                        {chat.visitorId.slice(0, 12).toUpperCase()}
                      </p>
                      <StatusBadge status={chat.status} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2">
                      <div>
                        {chat.name && (
                          <p className="text-sm font-medium">{chat.name}</p>
                        )}
                        {chat.email && (
                          <p className="text-xs text-muted-foreground">{chat.email}</p>
                        )}
                        {chat.phone && (
                          <p className="text-xs text-muted-foreground">{chat.phone}</p>
                        )}
                        {!chat.name && !chat.email && !chat.phone && (
                          <p className="text-xs text-muted-foreground italic">Anonymous visitor</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(chat.createdAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {lastMessagePreview}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold">{messageCount}</p>
                      <p className="text-xs text-muted-foreground">
                        {messageCount === 1 ? "message" : "messages"}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    resolved: "bg-blue-100 text-blue-800",
    closed: "bg-gray-100 text-gray-800",
    archived: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
