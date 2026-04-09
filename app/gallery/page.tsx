import type { Metadata } from "next";
import Image from "next/image";
import { LazyVideo } from "@/components/gallery/lazy-video";
import { sanityClient } from "@/lib/sanity/client";
import { galleryQuery } from "@/lib/sanity/queries";
import { urlFor } from "@/lib/sanity/image";

export const revalidate = 3600; // Revalidate every hour (ISR)

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "See our equipment, materials, and facility. Muskingum Materials in Zanesville, OH.",
};

// Neutral gray blur placeholder for images
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJiIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxMiIgLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2U3ZTVlNCIgZmlsdGVyPSJ1cmwoI2IpIiAvPjwvc3ZnPg==";

interface GalleryImage {
  _id: string;
  title: string;
  image: {
    asset: {
      _ref: string;
      _type: string;
    };
  };
  category: string;
  description?: string;
  sortOrder: number;
}

// Static fallback images when Sanity has no gallery content
const STATIC_GALLERY_IMAGES = [
  { _id: "aerial", title: "Aerial view of Muskingum Materials", category: "Facility", src: "/images/photos/aerial.jpg" },
  { _id: "equipment", title: "Heavy equipment at work", category: "Equipment", src: "/images/photos/equipment.jpg" },
  { _id: "piles", title: "Material piles", category: "Products", src: "/images/photos/piles.jpg" },
  { _id: "stone-hand", title: "Gravel close-up", category: "Products", src: "/images/photos/stone-hand.jpg" },
  { _id: "feeder", title: "Material feeder", category: "Equipment", src: "/images/photos/feeder.jpg" },
  { _id: "piles-2", title: "Gravel piles", category: "Products", src: "/images/photos/piles-2.jpg" },
  { _id: "piles-3", title: "Sand and gravel", category: "Products", src: "/images/photos/piles-3.jpg" },
  { _id: "piles-4", title: "Large material stockpile", category: "Products", src: "/images/photos/piles-4.jpg" },
  { _id: "piles-5", title: "Sorted materials", category: "Products", src: "/images/photos/piles-5.jpg" },
  { _id: "piles-6", title: "Material variety", category: "Products", src: "/images/photos/piles-6.jpg" },
  { _id: "piles-7", title: "Crushed stone", category: "Products", src: "/images/photos/piles-7.jpg" },
  { _id: "piles-8", title: "Gravel stockpile", category: "Products", src: "/images/photos/piles-8.jpg" },
  { _id: "piles-9", title: "Large aggregate pile", category: "Products", src: "/images/photos/piles-9.jpg" },
  { _id: "piles-close-up", title: "Close-up of gravel", category: "Products", src: "/images/photos/piles-close-up.jpg" },
  { _id: "stone-close-up", title: "Stone detail", category: "Products", src: "/images/photos/stone-close-up.jpg" },
  { _id: "stone-hand-2", title: "Holding gravel sample", category: "Products", src: "/images/photos/stone-hand-2.jpg" },
  { _id: "boulders", title: "Boulders", category: "Products", src: "/images/photos/boulders.jpg" },
  { _id: "clearing", title: "Site clearing", category: "Facility", src: "/images/photos/clearing.jpg" },
  { _id: "sorting", title: "Material sorting", category: "Equipment", src: "/images/photos/sorting.jpg" },
  { _id: "feeding-equipment", title: "Feeding equipment", category: "Equipment", src: "/images/photos/feeding-equipment.jpg" },
  { _id: "distant-equipment", title: "Equipment view", category: "Equipment", src: "/images/photos/distant-equipment.jpg" },
  { _id: "water", title: "Water feature at site", category: "Facility", src: "/images/photos/water.jpg" },
  { _id: "daughter-piles", title: "Daughter piles", category: "Products", src: "/images/photos/daughter-piles.jpg" },
];

export default async function GalleryPage() {
  let galleryImages: GalleryImage[] = [];
  try {
    galleryImages = await sanityClient.fetch<GalleryImage[]>(galleryQuery);
  } catch {
    // Sanity fetch failed; fall through to static fallback
  }

  const useSanity = galleryImages.length > 0;

  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">Gallery</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Take a look at our facility, equipment, and the quality materials we
            provide.
          </p>
        </div>

        {/* Video Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-heading mb-6">Videos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { src: "/images/videos/gravel.mp4", title: "Gravel Processing" },
              { src: "/images/videos/feeder.mp4", title: "Material Feeder" },
              { src: "/images/videos/water.mp4", title: "Site Overview" },
            ].map((video) => (
              <LazyVideo key={video.src} src={video.src} title={video.title} />
            ))}
          </div>
        </div>

        {/* Photo Grid */}
        <h2 className="text-2xl font-bold font-heading mb-6">Photos</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {useSanity
            ? galleryImages.map((image, index) => (
                <div
                  key={image._id}
                  className="relative break-inside-avoid rounded-lg overflow-hidden group"
                >
                  <Image
                    src={urlFor(image.image).width(600).height(400).url()}
                    alt={image.title}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={index < 3}
                    loading={index >= 3 ? "lazy" : undefined}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                    <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium">{image.title}</p>
                      <p className="text-xs text-white/70">{image.category}</p>
                    </div>
                  </div>
                </div>
              ))
            : STATIC_GALLERY_IMAGES.map((image, index) => (
                <div
                  key={image._id}
                  className="relative break-inside-avoid rounded-lg overflow-hidden group"
                >
                  <Image
                    src={image.src}
                    alt={image.title}
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    priority={index < 3}
                    loading={index >= 3 ? "lazy" : undefined}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                    <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-sm font-medium">{image.title}</p>
                      <p className="text-xs text-white/70">{image.category}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}
