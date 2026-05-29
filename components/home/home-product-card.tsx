"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AddToCartButton } from "@/components/order/add-to-cart-button";

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
  id,
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
    <Card className="group hover-lift flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-float transition-shadow duration-300 hover:shadow-glow">
      <Link href={detailHref} aria-label={`View ${name}`} className="block">
        <div className="relative m-2 h-48 overflow-hidden rounded-[1.35rem]">
          <Image
            src={imgSrc}
            alt={imageAlt || name}
            fill
            onError={() => setImgSrc(FALLBACK_IMAGE)}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <div className="absolute right-3 top-3 rounded-full bg-amber-600/95 px-3.5 py-1.5 text-white shadow-lg shadow-amber-900/20 backdrop-blur">
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
      <CardContent className="flex flex-1 flex-col px-5 pb-5 pt-3">
        <Link href={detailHref}>
          <h3 className="mb-1.5 text-lg font-bold transition-colors group-hover:text-primary">
            {name}
          </h3>
        </Link>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        {orderable && (
          <div className="mt-4">
            <AddToCartButton
              name={name}
              price={pricePerTon!}
              unit={unit}
              size="sm"
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
