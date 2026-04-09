import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProductsWithFilters } from "@/lib/products";
import { BUSINESS_INFO } from "@/data/business";
import { CatalogFilters } from "@/components/CatalogFilters";

export const metadata: Metadata = {
  title: "Material Catalog",
  description:
    "Browse our complete catalog of gravel, sand, soil, and stone products. Detailed guides, pricing, and specifications for every material we carry.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; sortBy?: string }>;
}) {
  const params = await searchParams;
  const products = await getProductsWithFilters({
    search: params.search,
    category: params.category,
    sortBy: params.sortBy as any,
  });

  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Material Catalog
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our full range of aggregates, soil, and sand products. Click
            any material for detailed specifications, uses, pros and cons, and
            comparisons.
          </p>
        </div>

        <CatalogFilters
          search={params.search}
          category={params.category}
          sortBy={params.sortBy}
        />

        {products.length === 0 ? (
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-2">
                  No Products Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  No products match your current search or filter criteria.
                </p>
                <p className="text-sm text-muted-foreground">
                  Try clearing your filters or adjusting your search to see more results.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {products.length} {products.length === 1 ? 'product' : 'products'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {products.map((product) => (
              <Link key={product.slug} href={`/catalog/${product.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                  {product.imageUrl && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <Image
                        src={product.imageUrl}
                        alt={product.imageAlt ?? product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <div className="text-right shrink-0 ml-3">
                        {product.price != null && product.price > 0 ? (
                          <span className="text-xl font-bold text-primary">
                            ${product.price.toFixed(2)}
                            <span className="text-xs text-muted-foreground font-normal block">
                              per {product.unit}
                            </span>
                          </span>
                        ) : product.marketPriceLowPerTon != null ? (
                          <span className="text-sm font-medium text-primary">
                            ${product.marketPriceLowPerTon}-$
                            {product.marketPriceHighPerTon}
                            <span className="text-xs text-muted-foreground font-normal block">
                              per ton (market)
                            </span>
                          </span>
                        ) : (
                          <Badge>Call for Price</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {product.shortDescription}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-primary font-medium">
                      View Details
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            </div>
          </>
        )}

        <div className="bg-muted/50 rounded-lg p-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Pricing Notes</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>* Local Muskingum Materials prices shown where available</li>
                <li>* Market price ranges shown for reference on other products</li>
                <li>* Ohio sales tax of 7.25% applies</li>
                <li>* Credit card processing fee of 4.5% per ticket</li>
                <li>* Volume discounts for large projects</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Ready to Order?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Call us today to place your order or get a custom quote.
              </p>
              <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
                <Button className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call {BUSINESS_INFO.phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
