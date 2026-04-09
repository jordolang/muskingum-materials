import type { Metadata } from "next";
import Image from "next/image";
import { Star } from "lucide-react";
import { sanityClient } from "@/lib/sanity/client";
import { testimonialsQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";
import { REVIEWS } from "@/data/reviews";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";

export const revalidate = 3600; // Revalidate every hour (ISR)

export const metadata: Metadata = {
  title: "Customer Reviews",
  description:
    "Read what our customers say about Muskingum Materials. Trusted supplier of gravel, sand, and aggregate in Zanesville, OH.",
};

interface Testimonial {
  _id: string;
  name: string;
  company?: string;
  rating: number;
  text: string;
  image?: SanityImageSource;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < rating
              ? "fill-amber-400 text-amber-400"
              : "fill-stone-300 text-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  let testimonials: Testimonial[] = [];
  try {
    testimonials = await sanityClient.fetch<Testimonial[]>(
      testimonialsQuery,
      {},
      { next: { tags: ["testimonial"] } }
    );
  } catch (error) {
    // Silently fall back to static reviews
  }

  // If no testimonials from Sanity, fall back to static reviews data
  const displayTestimonials =
    testimonials.length > 0
      ? testimonials
      : REVIEWS.map((review, index) => ({
          _id: `review-${index}`,
          name: review.name,
          rating: review.rating,
          text: review.text,
        }));

  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Customer Reviews
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about our products and service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {displayTestimonials.map((testimonial) => (
            <div
              key={testimonial._id}
              className="bg-card rounded-lg border shadow-sm p-6 flex flex-col"
            >
              {/* Rating */}
              <div className="mb-4">
                <StarRating rating={testimonial.rating} />
              </div>

              {/* Review Text */}
              <blockquote className="text-sm leading-relaxed mb-4 flex-grow">
                &ldquo;{testimonial.text}&rdquo;
              </blockquote>

              {/* Customer Info */}
              <div className="flex items-center gap-3 pt-4 border-t">
                {testimonial.image ? (
                  <Image
                    src={urlFor(testimonial.image).width(48).height(48).url()}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-lg font-semibold text-muted-foreground">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{testimonial.name}</p>
                  {testimonial.company && (
                    <p className="text-xs text-muted-foreground">
                      {testimonial.company}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
