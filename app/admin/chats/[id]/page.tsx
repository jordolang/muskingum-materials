import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, User, Mail, Phone, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { StatusUpdater } from "@/components/admin/status-updater";
import { requireAdmin } from "@/lib/admin-auth";

interface ChatDetailPageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
  > = {
    active: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
    closed: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
    archived: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
  };

  const config = variants[status] || { variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  // Check admin authentication
  const user = await requireAdmin();
  if (!user) {
    redirect("/admin");
  }

  const { id } = await params;

  let conversation;
  try {
    conversation = await prisma.chatConversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch {
    // DB not ready
  }

  if (!conversation) notFound();

  const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "closed", label: "Closed" },
    { value: "archived", label: "Archived" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/chats"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Conversations
        </Link>
        <h1 className="text-2xl font-bold font-heading">
          Conversation: {conversation.name || conversation.visitorId}
        </h1>
        <p className="text-sm text-muted-foreground">
          Started on{" "}
          {new Date(conversation.createdAt).toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex gap-3">
        <StatusBadge status={conversation.status} />
        <Badge variant="outline">{conversation.messages.length} messages</Badge>
      </div>

      {/* Status Updater */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusUpdater
            currentStatus={conversation.status}
            statusOptions={STATUS_OPTIONS}
            resourceId={conversation.id}
            resourceType="chats"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message History */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Message History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversation.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No messages in this conversation
                  </p>
                ) : (
                  conversation.messages.map((message, idx) => (
                    <div key={message.id}>
                      <div
                        className={`flex gap-3 ${
                          message.role === "user" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === "user"
                              ? "bg-muted"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.role === "user" ? (
                              <User className="h-3 w-3" />
                            ) : (
                              <Bot className="h-3 w-3" />
                            )}
                            <span className="text-xs font-semibold">
                              {message.role === "user" ? "Customer" : "Assistant"}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-line">{message.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              message.role === "user"
                                ? "text-muted-foreground"
                                : "text-primary-foreground/70"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      {idx < conversation.messages.length - 1 && <div className="h-4" />}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visitor Information */}
        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Visitor Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Visitor ID</p>
                <p className="font-medium font-mono text-sm mt-1">{conversation.visitorId}</p>
              </div>
              {conversation.name && (
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium mt-1">{conversation.name}</p>
                </div>
              )}
              {conversation.email && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </p>
                  <p className="font-medium mt-1">{conversation.email}</p>
                </div>
              )}
              {conversation.phone && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </p>
                  <p className="font-medium mt-1">{conversation.phone}</p>
                </div>
              )}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm mt-1">
                  {new Date(conversation.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
