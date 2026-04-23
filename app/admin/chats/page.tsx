import Link from "next/link";
import { ArrowRight, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { ChatsFilters } from "./chats-filters";

const CHATS_PER_PAGE = 10;

interface AdminChatsPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function AdminChatsPage({ searchParams }: AdminChatsPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const searchQuery = params.search || "";
  const statusFilter = params.status || "all";

  let chats: Array<{
    id: string;
    visitorId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      messages: number;
    };
  }> = [];
  let totalChats = 0;

  try {
    const skip = (currentPage - 1) * CHATS_PER_PAGE;

    // Build where clause for search and filter
    const where: {
      status?: string;
      OR?: Array<{
        visitorId?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        name?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    // Status filter
    if (statusFilter !== "all") {
      where.status = statusFilter;
    }

    // Search filter
    if (searchQuery) {
      where.OR = [
        { visitorId: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { name: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    [chats, totalChats] = await Promise.all([
      prisma.chatConversation.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: CHATS_PER_PAGE,
        skip,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
      prisma.chatConversation.count({ where }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalChats / CHATS_PER_PAGE);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Build query params for links
  const buildQueryString = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const page = overrides.page || currentPage.toString();
    const search = overrides.search !== undefined ? overrides.search : searchQuery;
    const status = overrides.status !== undefined ? overrides.status : statusFilter;

    if (page !== "1") params.set("page", page);
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Chat Conversations</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all customer chat conversations
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <ChatsFilters />

      {chats.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No chat conversations found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Chat conversations will appear here when customers start chatting."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Link href="/admin/chats">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {chats.map((chat) => {
              return (
                <Card key={chat.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold font-mono text-sm">
                            {chat.visitorId}
                          </p>
                          <StatusBadge status={chat.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Started: {new Date(chat.createdAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last activity: {new Date(chat.updatedAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          {chat.name || "Anonymous"}
                          {chat.email && (
                            <span className="text-muted-foreground text-xs ml-2">
                              {chat.email}
                            </span>
                          )}
                          {chat.phone && (
                            <span className="text-muted-foreground text-xs ml-2">
                              {chat.phone}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold">{chat._count.messages}</p>
                          <p className="text-xs text-muted-foreground">
                            {chat._count.messages === 1 ? "message" : "messages"}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * CHATS_PER_PAGE) + 1} to {Math.min(currentPage * CHATS_PER_PAGE, totalChats)} of {totalChats} conversations
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/chats${buildQueryString({ page: (currentPage - 1).toString() })}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrevPage}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3">
                  <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <Link href={`/admin/chats${buildQueryString({ page: (currentPage + 1).toString() })}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    archived: "bg-gray-100 text-gray-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
