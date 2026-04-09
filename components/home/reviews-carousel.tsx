import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { REVIEWS } from "@/data/reviews";
import { ReviewsCarouselClient } from "./reviews-carousel-client";

interface Testimonial {
  _id: string;
  name: string;
  company?: string;
  rating: number;
  text: string;
  image?: SanityImageSource;
}

interface ReviewsCarouselProps {
  testimonials: Testimonial[];
}

export function ReviewsCarousel({ testimonials }: ReviewsCarouselProps) {
  // If no testimonials from Sanity, fall back to static reviews data
  const displayTestimonials = testimonials.length > 0 ? testimonials : REVIEWS.map((review, index) => ({
    _id: `review-${index}`,
    name: review.name,
    rating: review.rating,
    text: review.text,
  }));

  return <ReviewsCarouselClient testimonials={displayTestimonials} />;
}
