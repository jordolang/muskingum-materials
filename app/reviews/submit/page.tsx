"use client";

import { useState } from "react";
import { StarRating } from "@/components/reviews/star-rating";

export default function ReviewSubmitPage() {
  const [rating, setRating] = useState(0);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Submit a Review</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            <StarRating value={rating} onChange={setRating} />
            <p className="mt-2 text-sm text-stone-600">
              Selected rating: {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'None'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
