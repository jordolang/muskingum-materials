"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface HomeProductCardProps {
  id: string;
  name: string;
  description: string;
  pricePerTon: number | null;
  unit: string;
  imageUrl?: string;
  imageAlt?: string;
  slug?: string;
}

export function HomeProductCard({
  name,
  description,
  pricePerTon,
  unit,
  imageUrl,
  imageAlt,
  slug,
}: HomeProductCardProps) {
  const orderable = pricePerTon != null && pricePerTon > 0;
  const detailHref = slug ? `/catalog/${slug}` : `/order?product=${encodeURIComponent(name)}`;
  const FALLBACK_IMAGE = "/images/photos/piles.jpg";
  const [imgSrc, setImgSrc] = useState(imageUrl || FALLBACK_IMAGE);

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-stone-300/70 bg-gradient-to-br from-white via-white to-amber-50/70 shadow-float transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-amber-300/70 hover:shadow-glow motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Warm radial glow that blooms in on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(110% 70% at 50% -10%, rgba(245,158,11,0.16), transparent 60%)",
        }}
      />

      <Link
        href={detailHref}
        aria-label={`View ${name}`}
        className="relative z-10 block"
      >
        <div className="relative m-2 h-48 overflow-hidden rounded-[1.35rem] ring-1 ring-stone-900/5">
          <Image
            src={imgSrc}
            alt={imageAlt || name}
            fill
            // Grid is 1/2/3 columns (mobile/sm/lg). Without `sizes`, next/image
            // assumes 100vw and serves an oversized file for every card; this
            // lets it pick a right-sized image per breakpoint.
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            // Thumbnail-scale product photos under a gradient scrim — a lower
            // quality is imperceptible here but cuts the bulk of the wasted
            // image bytes PageSpeed flags for these cards.
            quality={60}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          {/* Light sheen sweeping across on hover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
          />
          <div className="absolute right-3 top-3 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 px-3.5 py-1.5 text-white shadow-lg shadow-amber-900/25 ring-1 ring-white/25 backdrop-blur transition-transform duration-300 group-hover:scale-105">
            {orderable ? (
              <span className="flex items-baseline gap-0.5">
                <span className="text-base font-bold">${pricePerTon!.toFixed(2)}</span>
                <span className="text-[0.7rem] opacity-90">/{unit}</span>
              </span>
            ) : (
              <span className="text-sm font-bold">Call for Pricing</span>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="relative z-10 flex flex-1 flex-col px-5 pb-5 pt-3">
        <Link href={detailHref}>
          <h3 className="mb-1.5 text-lg font-bold transition-colors group-hover:text-primary">
            {name}
          </h3>
        </Link>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
