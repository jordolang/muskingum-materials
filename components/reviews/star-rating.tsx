"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  className?: string;
  disabled?: boolean;
}

const StarRating = React.forwardRef<HTMLDivElement, StarRatingProps>(
  ({ value, onChange, className, disabled = false }, ref) => {
    const [hoverRating, setHoverRating] = React.useState<number | null>(null);

    const handleClick = (rating: number) => {
      if (!disabled) {
        onChange(rating);
      }
    };

    const handleMouseEnter = (rating: number) => {
      if (!disabled) {
        setHoverRating(rating);
      }
    };

    const handleMouseLeave = () => {
      setHoverRating(null);
    };

    const displayRating = hoverRating ?? value;

    return (
      <div
        ref={ref}
        className={cn("flex gap-1", className)}
        onMouseLeave={handleMouseLeave}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const rating = i + 1;
          const isFilled = rating <= displayRating;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              disabled={disabled}
              className={cn(
                "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"
              )}
              aria-label={`Rate ${rating} star${rating !== 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-stone-200 text-stone-300"
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }
);

StarRating.displayName = "StarRating";

export { StarRating };
