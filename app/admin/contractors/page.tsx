import Link from "next/link";
import { ArrowRight, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

const CONTRACTORS_PER_PAGE = 10;

interface AdminContractorsPageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

function ApprovalBadge({ approved }: { approved: boolean }) {
  if (approved) {
    return (
      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
        Approved
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
      Pending
    </Badge>
  );
}

export default async function AdminContractorsPage({ searchParams }: AdminContractorsPageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const searchQuery = params.search || "";
  const statusFilter = params.status || "all";

  let contractors: Array<{
    id: string;
    userId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    isContractor: boolean;
    contractorDiscount: number | null;
    netTermsApproved: boolean;
    netTermsCreditLimit: number | null;
    netTermsLength: number | null;
    netTermsBalance: number;
    createdAt: Date;
  }> = [];
  let totalContractors = 0;

  try {
    const skip = (currentPage - 1) * CONTRACTORS_PER_PAGE;

    // Build where clause for search and filter
    const where: {
      isContractor: boolean;
      netTermsApproved?: boolean;
      OR?: Array<{
        name?: { contains: string; mode: "insensitive" };
        email?: { contains: string; mode: "insensitive" };
        company?: { contains: string; mode: "insensitive" };
      }>;
    } = {
      isContractor: true,
    };

    // Status filter
    if (statusFilter === "approved") {
      where.netTermsApproved = true;
    } else if (statusFilter === "pending") {
      where.netTermsApproved = false;
    }

    // Search filter
    if (searchQuery) {
      where.OR = [
        { name: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { company: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    [contractors, totalContractors] = await Promise.all([
      prisma.userProfile.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: CONTRACTORS_PER_PAGE,
        skip,
      }),
      prisma.userProfile.count({ where }),
    ]);
  } catch {
    // DB not ready
  }

  const totalPages = Math.ceil(totalContractors / CONTRACTORS_PER_PAGE);
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
          <h1 className="text-2xl font-bold font-heading">Contractors</h1>
          <p className="text-sm text-muted-foreground">
            Manage contractor accounts and net terms approvals
          </p>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              defaultValue={searchQuery}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const target = e.target as HTMLInputElement;
                  window.location.href = `/admin/contractors${buildQueryString({ search: target.value, page: "1" })}`;
                }
              }}
            />
            <select
              defaultValue={statusFilter}
              className="px-3 py-2 border rounded-md text-sm"
              onChange={(e) => {
                window.location.href = `/admin/contractors${buildQueryString({ status: e.target.value, page: "1" })}`;
              }}
            >
              <option value="all">All Contractors</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {contractors.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No contractors found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "Contractors will appear here when users register as contractors."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <Link href="/admin/contractors">
                <Button variant="outline">Clear Filters</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {contractors.map((contractor) => {
              const creditUsed = contractor.netTermsBalance;
              const creditLimit = contractor.netTermsCreditLimit || 0;
              const creditAvailable = creditLimit - creditUsed;
              const creditPercent = creditLimit > 0 ? (creditUsed / creditLimit) * 100 : 0;

              return (
                <Link key={contractor.id} href={`/admin/contractors/${contractor.userId}`}>
                  <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-sm">
                              {contractor.name || "Unnamed Contractor"}
                            </p>
                            <ApprovalBadge approved={contractor.netTermsApproved} />
                            {contractor.contractorDiscount && contractor.contractorDiscount > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {contractor.contractorDiscount}% Discount
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(contractor.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-sm mt-1">
                            {contractor.email}
                            {contractor.company && (
                              <span className="text-muted-foreground text-xs ml-2">
                                {contractor.company}
                              </span>
                            )}
                          </p>
                          {contractor.netTermsApproved && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span>
                                Net {contractor.netTermsLength || 30} •
                                Credit: ${creditAvailable.toFixed(2)} / ${creditLimit.toFixed(2)} available
                              </span>
                              {creditPercent > 0 && (
                                <div className="mt-1 w-full max-w-xs bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      creditPercent > 90 ? "bg-red-500" :
                                      creditPercent > 70 ? "bg-yellow-500" :
                                      "bg-green-500"
                                    }`}
                                    style={{ width: `${Math.min(100, creditPercent)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {contractor.netTermsApproved && (
                            <div className="text-right">
                              <p className="text-lg font-bold">
                                ${contractor.netTermsBalance.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">Balance Due</p>
                            </div>
                          )}
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
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
                Showing {((currentPage - 1) * CONTRACTORS_PER_PAGE) + 1} to {Math.min(currentPage * CONTRACTORS_PER_PAGE, totalContractors)} of {totalContractors} contractors
              </p>
              <div className="flex gap-2">
                <Link href={`/admin/contractors${buildQueryString({ page: (currentPage - 1).toString() })}`}>
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
                <Link href={`/admin/contractors${buildQueryString({ page: (currentPage + 1).toString() })}`}>
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
