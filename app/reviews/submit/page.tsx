import { ReviewForm } from "@/components/reviews/review-form";

export default function ReviewSubmitPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Submit a Review</h1>
        <p className="text-muted-foreground mb-6">
          Share your experience with Muskingum Materials. Your feedback helps us serve you better
          and helps other customers make informed decisions.
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <ReviewForm />
        </div>
      </div>
    </div>
  );
}
