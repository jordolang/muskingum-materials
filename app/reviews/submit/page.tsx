import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/reviews/review-form";

export const metadata: Metadata = {
  title: "Submit a Review",
  description:
    "Share your experience with Muskingum Materials. Your feedback helps us improve and helps others make informed decisions.",
};

export default function ReviewSubmitPage() {
  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">Submit a Review</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We value your feedback! Share your experience with Muskingum Materials
            to help us improve and assist others in making informed decisions.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
