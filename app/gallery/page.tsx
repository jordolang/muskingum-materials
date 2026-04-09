import Image from "next/image";
import { generateGalleryMetadata } from "@/lib/seo/metadata";

export const metadata = generateGalleryMetadata();

const GALLERY_IMAGES = [
  { src: "/images/photos/aerial.jpg", alt: "Aerial view of Muskingum Materials", category: "Facility" },
  { src: "/images/photos/equipment.jpg", alt: "Heavy equipment at work", category: "Equipment" },
  { src: "/images/photos/piles.jpg", alt: "Material piles", category: "Products" },
  { src: "/images/photos/stone-hand.jpg", alt: "Gravel close-up", category: "Products" },
  { src: "/images/photos/feeder.jpg", alt: "Material feeder", category: "Equipment" },
  { src: "/images/photos/piles-2.jpg", alt: "Gravel piles", category: "Products" },
  { src: "/images/photos/piles-3.jpg", alt: "Sand and gravel", category: "Products" },
  { src: "/images/photos/piles-4.jpg", alt: "Large material stockpile", category: "Products" },
  { src: "/images/photos/piles-5.jpg", alt: "Sorted materials", category: "Products" },
  { src: "/images/photos/piles-6.jpg", alt: "Material variety", category: "Products" },
  { src: "/images/photos/piles-7.jpg", alt: "Crushed stone", category: "Products" },
  { src: "/images/photos/piles-8.jpg", alt: "Gravel stockpile", category: "Products" },
  { src: "/images/photos/piles-9.jpg", alt: "Large aggregate pile", category: "Products" },
  { src: "/images/photos/piles-close-up.jpg", alt: "Close-up of gravel", category: "Products" },
  { src: "/images/photos/stone-close-up.jpg", alt: "Stone detail", category: "Products" },
  { src: "/images/photos/stone-hand-2.jpg", alt: "Holding gravel sample", category: "Products" },
  { src: "/images/photos/boulders.jpg", alt: "Boulders", category: "Products" },
  { src: "/images/photos/clearing.jpg", alt: "Site clearing", category: "Facility" },
  { src: "/images/photos/sorting.jpg", alt: "Material sorting", category: "Equipment" },
  { src: "/images/photos/feeding-equipment.jpg", alt: "Feeding equipment", category: "Equipment" },
  { src: "/images/photos/distant-equipment.jpg", alt: "Equipment view", category: "Equipment" },
  { src: "/images/photos/water.jpg", alt: "Water feature at site", category: "Facility" },
  { src: "/images/photos/daughter-piles.jpg", alt: "Daughter piles", category: "Products" },
];

export default function GalleryPage() {
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
              <div key={video.src} className="rounded-lg overflow-hidden">
                <video
                  controls
                  preload="metadata"
                  className="w-full aspect-video object-cover"
                  poster=""
                >
                  <source src={video.src} type="video/mp4" />
                </video>
                <p className="text-sm font-medium mt-2">{video.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Grid */}
        <h2 className="text-2xl font-bold font-heading mb-6">Photos</h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {GALLERY_IMAGES.map((image) => (
            <div
              key={image.src}
              className="relative break-inside-avoid rounded-lg overflow-hidden group"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={600}
                height={400}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                <div className="p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium">{image.alt}</p>
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
