"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CATEGORY_OPTIONS = [
  { label: "All Categories", value: "" },
  { label: "Sand", value: "sand" },
  { label: "Gravel", value: "gravel" },
  { label: "Soil", value: "soil" },
  { label: "Stone", value: "stone" },
  { label: "Fill", value: "fill" },
] as const;

const SORT_OPTIONS = [
  { label: "Name: A-Z", value: "name-asc" },
  { label: "Name: Z-A", value: "name-desc" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
] as const;

interface CatalogControlsProps {
  initialSearch?: string;
  initialCategory?: string;
  initialSort?: string;
}

export function CatalogControls({
  initialSearch = "",
  initialCategory = "",
  initialSort = "name-asc",
}: CatalogControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSort);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL({ search: searchTerm });
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const updateURL = useCallback(
    (updates: { search?: string; category?: string; sort?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update search param
      if (updates.search !== undefined) {
        if (updates.search) {
          params.set("q", updates.search);
        } else {
          params.delete("q");
        }
      }

      // Update category param
      if (updates.category !== undefined) {
        if (updates.category) {
          params.set("category", updates.category);
        } else {
          params.delete("category");
        }
      }

      // Update sort param
      if (updates.sort !== undefined) {
        if (updates.sort && updates.sort !== "name-asc") {
          params.set("sort", updates.sort);
        } else {
          params.delete("sort");
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.push(newUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    updateURL({ category: value });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    updateURL({ sort: value });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setCategory("");
    setSortBy("name-asc");
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = searchTerm || category || sortBy !== "name-asc";

  return (
    <div className="space-y-4">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="w-full"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filter Controls */}
      <div
        className={cn(
          "flex flex-col lg:flex-row gap-4",
          !showMobileFilters && "hidden lg:flex"
        )}
      >
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full lg:w-48">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full lg:w-56">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={handleClearFilters}
            className="w-full lg:w-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <button
                onClick={() => setSearchTerm("")}
                className="ml-1 hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {category && (
            <Badge variant="secondary" className="gap-1">
              Category:{" "}
              {CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label}
              <button
                onClick={() => handleCategoryChange("")}
                className="ml-1 hover:text-foreground"
                aria-label="Clear category filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {sortBy !== "name-asc" && (
            <Badge variant="secondary" className="gap-1">
              Sort: {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
