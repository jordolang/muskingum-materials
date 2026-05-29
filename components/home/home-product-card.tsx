"use client";

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

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-card h-full flex flex-col">
      <Link href={detailHref} aria-label={`View ${name}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl || "/images/photos/piles.jpg"}
            alt={imageAlt || name}
            fill
            className="object-cover hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 right-3 bg-amber-600 text-white px-3 py-1.5 rounded-lg shadow-md">
            {orderable ? (
              <>
                <span className="text-lg font-bold">${pricePerTon!.toFixed(2)}</span>
                <span className="text-xs opacity-90">/{unit}</span>
              </>
            ) : (
              <span className="text-sm font-bold">Call for Pricing</span>
            )}
          </div>
        </div>
      </Link>
      <CardContent className="p-5 flex flex-col flex-1">
        <Link href={detailHref}>
          <h3 className="font-bold text-lg mb-1.5 hover:text-primary transition-colors">{name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>
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
