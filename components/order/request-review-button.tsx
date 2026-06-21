"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/use-toast";
import { logger } from "@/lib/logger";
import type { ProjectSiteData } from "./project-estimator";

const reviewRequestSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type ReviewRequestData = z.infer<typeof reviewRequestSchema>;

interface RequestReviewButtonProps {
  projectSite: ProjectSiteData | null;
}

export function RequestReviewButton({ projectSite }: RequestReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ReviewRequestData>({
    resolver: zodResolver(reviewRequestSchema),
    mode: "onChange",
  });

  async function onSubmit(data: ReviewRequestData) {
    if (!projectSite || !projectSite.estimate) {
      toast({
        variant: "destructive",
        title: "No Estimate Available",
        description: "Please create a project estimate first.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          products: [
            {
              productName: "Staff Review Request",
              quantity: `~${projectSite.estimate.tons.toFixed(1)} tons estimated`,
            },
          ],
          notes: data.notes || undefined,
          projectSite: {
            address: projectSite.address,
            location: projectSite.location,
            mode: projectSite.mode,
            depthInches: projectSite.depthInches,
            lengthFt: projectSite.lengthFt,
            widthFt: projectSite.widthFt,
            totalAreaSqFt: projectSite.totalAreaSqFt,
            polygons: projectSite.polygons,
            estimate: projectSite.estimate,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit review request");
      }

      toast({
        title: "Review request sent!",
        description: "Our team will contact you within 24 hours.",
      });

      reset();
      setIsOpen(false);
    } catch (error) {
      logger.error("Review request error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancel() {
    reset();
    setIsOpen(false);
  }

  const hasEstimate = projectSite && projectSite.estimate;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(true)}
        disabled={!hasEstimate}
        className="w-full gap-2"
      >
        <CheckCircle2 className="h-4 w-4" />
        Unsure? Request a staff review
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request Staff Review</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-foreground space-y-2 pt-1">
                <p>
                  Our team will review your project estimate and polygon outline to
                  confirm the recommended quantity before you order.
                </p>
                {projectSite?.address && (
                  <p className="text-xs text-muted-foreground">
                    Project: {projectSite.address}
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="review-name" className="text-sm font-medium mb-1 block">
                Name *
              </label>
              <Input
                id="review-name"
                placeholder="Your full name"
                autoComplete="name"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="review-email" className="text-sm font-medium mb-1 block">
                Email *
              </label>
              <Input
                id="review-email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="review-phone" className="text-sm font-medium mb-1 block">
                Phone
              </label>
              <Input
                id="review-phone"
                type="tel"
                placeholder="(740) 555-0123"
                autoComplete="tel"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="review-notes" className="text-sm font-medium mb-1 block">
                Additional Notes (optional)
              </label>
              <Textarea
                id="review-notes"
                placeholder="Any specific concerns or questions about your project..."
                rows={3}
                {...register("notes")}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="w-full sm:w-auto gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send Review Request"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
