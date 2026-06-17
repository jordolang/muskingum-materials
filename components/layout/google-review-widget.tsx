import Link from "next/link";
import { Star, ExternalLink, PenLine } from "lucide-react";
import { BUSINESS_INFO } from "@/data/business";
import { REVIEWS } from "@/data/reviews";

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1A6.6 6.6 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

/**
 * Lightweight, dependency-free review widget for the footer.
 *
 * It drives Google Business reviews — the primary CTA opens our Google profile
 * to read or leave a review — without embedding a third-party script (which
 * would require loosening the CSP). The numeric rating shown is our own
 * aggregated customer rating from on-site reviews; it is intentionally labeled
 * as such rather than presented as a live Google score, since we don't fetch
 * from the Google API here. No API key, no runtime fetch, nothing to break.
 */
export function GoogleReviewWidget() {
  const ratings = REVIEWS.map((r) => r.rating);
  const reviewCount = ratings.length;
  const average =
    reviewCount > 0
      ? ratings.reduce((sum, n) => sum + n, 0) / reviewCount
      : 0;
  // Display value and star fill are derived from the same rounded number so
  // the stars always match the score shown.
  const rounded = Math.round(average * 10) / 10;
  const filledStars = Math.round(rounded);
  const googleUrl = BUSINESS_INFO.social.google?.trim();

  return (
    <div className="rounded-xl border border-white/10 bg-stone-800/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <GoogleGlyph className="h-5 w-5" />
        <span className="text-sm font-semibold text-white">
          Reviews
        </span>
      </div>

      {reviewCount > 0 ? (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-bold text-white tabular-nums">
              {rounded.toFixed(1)}
            </span>
            <div
              className="flex"
              aria-label={`${rounded.toFixed(1)} out of 5 stars`}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < filledStars
                      ? "fill-amber-400 text-amber-400"
                      : "fill-stone-600 text-stone-600"
                  }`}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-stone-400">
            Average of {reviewCount} customer review
            {reviewCount !== 1 ? "s" : ""}
          </p>
        </div>
      ) : (
        <p className="text-xs text-stone-400 mb-3">
          Be the first to leave us a review!
        </p>
      )}

      <div className="flex flex-col gap-2">
        {googleUrl && (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white text-stone-900 text-xs font-semibold px-3 py-2 transition-colors hover:bg-stone-200"
          >
            <PenLine className="h-3.5 w-3.5" />
            Leave a Google Review
          </a>
        )}
        <div className="flex gap-2">
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-stone-900/50 text-stone-300 text-xs font-medium px-3 py-2 transition-colors hover:bg-stone-700"
            >
              Read on Google
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          )}
          <Link
            href="/reviews"
            className="flex-1 inline-flex items-center justify-center rounded-md border border-white/10 bg-stone-900/50 text-stone-300 text-xs font-medium px-3 py-2 transition-colors hover:bg-stone-700"
          >
            All Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}
