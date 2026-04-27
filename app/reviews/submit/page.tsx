"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewForm } from "@/components/reviews/review-form";
import { Loader2 } from "lucide-react";

export default function ReviewSubmitPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
              <ReviewForm
                initialName={user?.fullName || ""}
                initialEmail={user?.primaryEmailAddress?.emailAddress || ""}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
