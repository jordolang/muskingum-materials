import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { QuotesFilters } from "./quotes-filters";
import Link from "next/link";

const QUOTES_PER_PAGE = 10;

interface AdminQuotesPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className?: string }> = {
    pending: { variant: "outline", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    contacted: { variant: "outline", className: "bg-blue-50 text-blue-700 border-blue-200" },
    quoted: { variant: "outline", className: "bg-purple-50 text-purple-700 border-purple-200" },
    accepted: { variant: "outline", className: "bg-green-50 text-green-700 border-green-200" },
    rejected: { variant: "outline", className: "bg-gray-50 text-gray-700 border-gray-200" },
  };

  const config = variants[status] || { variant: "secondary" as const };

  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}

export default async function AdminQuotesPage({ searchParams }: AdminQuotesPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const searchQuery = params.search || "";
  const statusFilter = params.status || "all";

  let quotes: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    products: unknown;
    quantity: string | null;
    deliveryAddr: string | null;
    notes: string | null;
    status: string;
    createdAt: Date;
  }> = [];
  let totalQuotes = 0;

  try {
    const skip = (currentPage - 1) * QUOTES_PER_PAGE;

    // Build where clause for search and filter
    const where: {
      status?: string;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        company?: { contains: string; mode: "insensitive" };
      }>;
    } = {};

    // Status filter
    if (statusFilter !== "all") {
      where.status = statusFilter;
    }

    // Search filter
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { company: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    [quotes, totalQuotes] = await Promise.all([
      prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: QUOTES_PER_PAGE,
        skip,
      }),
      prisma.quoteRequest.count({ where }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalQuotes / QUOTES_PER_PAGE);
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
          <h1 className="text-2xl font-bold font-heading">Quote Requests</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all quote requests
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <QuotesFilters />

      {quotes.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No quote requests found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Quote requests will appear here when customers submit them."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Link href="/admin/quotes">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {quotes.map((quote) => {
              const products = quote.products as Array<{ name: string; category?: string }> | null;
              return (
                <Link key={quote.id} href={`/admin/quotes/${quote.id}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5">
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-base">{quote.name}</p>
                            <StatusBadge status={quote.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(quote.createdAt).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="text-sm space-y-1">
                        <p className="text-muted-foreground">
                          <span className="font-medium text-foreground">Email:</span> {quote.email}
                        </p>
                        {quote.phone && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Phone:</span> {quote.phone}
                          </p>
                        )}
                        {quote.company && (
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Company:</span> {quote.company}
                          </p>
                        )}
                      </div>

                      {/* Products */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                          Products Requested
                        </p>
                        <div className="bg-muted/50 rounded-md p-3">
                          {products && products.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {products.map((product, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {product.name}
                                  {product.category && (
                                    <span className="ml-1 text-muted-foreground">
                                      ({product.category})
                                    </span>
                                  )}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">No products specified</p>
                          )}
                        </div>
                      </div>

                      {/* Quantity */}
                      {quote.quantity && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Quantity
                          </p>
                          <p className="text-sm">{quote.quantity}</p>
                        </div>
                      )}

                      {/* Delivery Address */}
                      {quote.deliveryAddr && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Delivery Address
                          </p>
                          <p className="text-sm text-muted-foreground">{quote.deliveryAddr}</p>
                        </div>
                      )}

                      {/* Notes */}
                      {quote.notes && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-muted-foreground">{quote.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * QUOTES_PER_PAGE) + 1} to {Math.min(currentPage * QUOTES_PER_PAGE, totalQuotes)} of {totalQuotes} quotes
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/quotes${buildQueryString({ page: (currentPage - 1).toString() })}`}>
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
                <Link href={`/admin/quotes${buildQueryString({ page: (currentPage + 1).toString() })}`}>
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
