"use client";

import { useRouter, useSearchParams } from "next/navigation";

/**
 * Interactive search + status filter for the contractors list. Lives in a
 * Client Component because it uses event handlers (onKeyDown/onChange) — those
 * cannot be passed from a Server Component (the contractors page). Navigation
 * updates the URL search params, which the server page reads to query.
 */
export function ContractorsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";

  const navigate = (updates: { search?: string; status?: string }) => {
    const params = new URLSearchParams(searchParams);
    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
      else params.delete("search");
    }
    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }
    // Reset to page 1 whenever filters change.
    params.delete("page");
    const qs = params.toString();
    router.push(`/admin/contractors${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        placeholder="Search by name, email, or company..."
        defaultValue={searchQuery}
        className="flex-1 px-3 py-2 border rounded-md text-sm"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            navigate({ search: (e.target as HTMLInputElement).value });
          }
        }}
      />
      <select
        defaultValue={statusFilter}
        className="px-3 py-2 border rounded-md text-sm"
        onChange={(e) => navigate({ status: e.target.value })}
      >
        <option value="all">All Contractors</option>
        <option value="approved">Approved</option>
        <option value="pending">Pending</option>
      </select>
    </div>
  );
}
