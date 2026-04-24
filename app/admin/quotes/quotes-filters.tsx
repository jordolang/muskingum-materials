"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export function QuotesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";

  const handleSearchChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    updateFilters({ search });
  };

  const handleStatusChange = (status: string) => {
    updateFilters({ status });
  };

  const updateFilters = (updates: { search?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams);

    // Update or remove search param
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }

    // Update or remove status param
    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }

    // Reset to page 1 when filters change
    params.delete("page");

    const queryString = params.toString();
    router.push(`/admin/quotes${queryString ? `?${queryString}` : ""}`);
  };

  const buildQueryString = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(overrides).forEach(([key, value]) => {
      if (value === undefined || value === "" || (key === "status" && value === "all")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <form onSubmit={handleSearchChange} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                name="search"
                placeholder="Search by name, email, or company..."
                defaultValue={searchQuery}
                className="pl-9"
              />
            </form>
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="quoted">Quoted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || statusFilter !== "all") && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground flex-wrap">
            <span>Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchQuery}
                <Link href={buildQueryString({ search: "" })} className="ml-1 hover:text-foreground">
                  ×
                </Link>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 capitalize">
                Status: {statusFilter}
                <Link href={buildQueryString({ status: "all" })} className="ml-1 hover:text-foreground">
                  ×
                </Link>
              </Badge>
            )}
            <Link href="/admin/quotes" className="text-primary hover:underline">
              Clear all
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
