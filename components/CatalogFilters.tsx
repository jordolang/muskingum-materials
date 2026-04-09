"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useTransition } from "react";

interface CatalogFiltersProps {
  search?: string;
  category?: string;
  sortBy?: string;
}

export function CatalogFilters({
  search = "",
  category = "",
  sortBy = "",
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      startTransition(() => {
        router.push(`/catalog?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ search: e.target.value });
  };

  const handleCategoryChange = (value: string) => {
    updateFilters({ category: value });
  };

  const handleSortChange = (value: string) => {
    updateFilters({ sortBy: value });
  };

  return (
    <div className="bg-muted/50 rounded-lg p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* Category Filter */}
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="gravel">Gravel</SelectItem>
            <SelectItem value="stone">Stone</SelectItem>
            <SelectItem value="soil">Soil</SelectItem>
            <SelectItem value="sand">Sand</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Dropdown */}
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Default Order</SelectItem>
            <SelectItem value="name-asc">Name (A-Z)</SelectItem>
            <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            <SelectItem value="price-asc">Price (Low to High)</SelectItem>
            <SelectItem value="price-desc">Price (High to Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
