"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/reviews/star-rating";
import { reviewSchema, type ReviewData } from "@/lib/schemas";

interface ReviewFormProps {
  initialName?: string;
  initialEmail?: string;
}

export function ReviewForm({ initialName, initialEmail }: ReviewFormProps = {}) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ReviewData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: initialName || "",
      email: initialEmail || "",
      rating: 0,
    },
  });

  async function onSubmit(data: ReviewData) {
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Submission failed");

      setSubmitted(true);
      reset();
    } catch {
      setError("Something went wrong. Please try again or contact us directly.");
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
        <p className="text-muted-foreground mb-4">
          Your review has been submitted and will appear on our site after moderation.
        </p>
        <Button variant="outline" onClick={() => setSubmitted(false)}>
          Submit Another Review
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="name">
            Name *
          </label>
          <Input id="name" placeholder="Your name" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="email">
            Email
          </label>
          <Input id="email" type="email" placeholder="your@email.com" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block" htmlFor="rating">
            Rating *
          </label>
          <Controller
            name="rating"
            control={control}
            render={({ field }) => (
              <StarRating
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.rating && (
            <p className="text-xs text-destructive mt-1">{errors.rating.message}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block" htmlFor="projectType">
            Project Type *
          </label>
          <Controller
            name="projectType"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="projectType">
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driveway">Driveway</SelectItem>
                  <SelectItem value="patio">Patio</SelectItem>
                  <SelectItem value="landscaping">Landscaping</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.projectType && (
            <p className="text-xs text-destructive mt-1">{errors.projectType.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="orderNumber">
          Order Number (Optional)
        </label>
        <Input
          id="orderNumber"
          placeholder="e.g., ORD-12345"
          {...register("orderNumber")}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block" htmlFor="text">
          Your Review *
        </label>
        <Textarea
          id="text"
          placeholder="Tell us about your experience with Muskingum Materials..."
          rows={5}
          {...register("text")}
        />
        {errors.text && (
          <p className="text-xs text-destructive mt-1">{errors.text.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
