import Link from "next/link";
import { ArrowRight, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { LeadsFilters } from "./leads-filters";

const LEADS_PER_PAGE = 10;

interface AdminLeadsPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string; source?: string }>;
}

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const searchQuery = params.search || "";
  const statusFilter = params.status || "all";
  const sourceFilter = params.source || "all";

  let leads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    message: string | null;
    source: string;
    status: string;
    createdAt: Date;
  }> = [];
  let totalLeads = 0;

  try {
    const skip = (currentPage - 1) * LEADS_PER_PAGE;

    // Build where clause for search and filter
    const where: {
      status?: string;
      source?: string;
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

    // Source filter
    if (sourceFilter !== "all") {
      where.source = sourceFilter;
    }

    // Search filter
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { company: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    [leads, totalLeads] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: LEADS_PER_PAGE,
        skip,
      }),
      prisma.lead.count({ where }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalLeads / LEADS_PER_PAGE);
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  // Build query params for links
  const buildQueryString = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const page = overrides.page || currentPage.toString();
    const search = overrides.search !== undefined ? overrides.search : searchQuery;
    const status = overrides.status !== undefined ? overrides.status : statusFilter;
    const source = overrides.source !== undefined ? overrides.source : sourceFilter;

    if (page !== "1") params.set("page", page);
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (source !== "all") params.set("source", source);

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading">Leads</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all customer leads
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <LeadsFilters />

      {leads.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No leads found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all" || sourceFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Leads will appear here when customers submit inquiries."}
            </p>
            {(searchQuery || statusFilter !== "all" || sourceFilter !== "all") && (
              <Link href="/admin/leads">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {leads.map((lead) => {
              return (
                <Card key={lead.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold text-sm">
                            {lead.name}
                          </p>
                          <StatusBadge status={lead.status} />
                          <SourceBadge source={lead.source} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {lead.email}
                          </p>
                          {lead.phone && (
                            <p className="text-sm text-muted-foreground">
                              {lead.phone}
                            </p>
                          )}
                          {lead.company && (
                            <p className="text-sm font-medium">
                              {lead.company}
                            </p>
                          )}
                          {lead.message && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {lead.message}
                            </p>
                          )}
                        </div>
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
                Showing {((currentPage - 1) * LEADS_PER_PAGE) + 1} to {Math.min(currentPage * LEADS_PER_PAGE, totalLeads)} of {totalLeads} leads
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/leads${buildQueryString({ page: (currentPage - 1).toString() })}`}>
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
                <Link href={`/admin/leads${buildQueryString({ page: (currentPage + 1).toString() })}`}>
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
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-purple-100 text-purple-800",
    converted: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const map: Record<string, string> = {
    website: "bg-slate-100 text-slate-800",
    referral: "bg-indigo-100 text-indigo-800",
    social: "bg-pink-100 text-pink-800",
    email: "bg-cyan-100 text-cyan-800",
    phone: "bg-orange-100 text-orange-800",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[source] || "bg-gray-100 text-gray-800"}`}>
      {source}
    </span>
  );
}
