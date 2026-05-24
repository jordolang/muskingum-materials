/**
 * Sanity image URL builder utility
 * Provides helper for generating optimized image URLs from Sanity image assets
 */

import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url/lib/types/types";
import { sanityConfig } from "./config";

const builder = imageUrlBuilder({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
});

/**
 * Creates an image URL builder for a Sanity image asset
 * @param source - Sanity image reference or asset object
 * @returns Image URL builder with chainable methods (width, height, format, etc.)
 * @example
 * ```ts
 * import { urlFor } from "@/lib/sanity/image";
 *
 * // Basic usage
 * const imageUrl = urlFor(product.image).url();
 *
 * // With transformations
 * const thumbnailUrl = urlFor(product.image)
 *   .width(400)
 *   .height(300)
 *   .format('webp')
 *   .url();
 * ```
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
