import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Phone,
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  ArrowRightLeft,
  Ruler,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProductBySlug, getProducts } from "@/lib/products";
import { BUSINESS_INFO } from "@/data/business";
import { StockBadge, type StockStatus } from "@/components/catalog/StockBadge";
import { RestockNotifyButton } from "@/components/catalog/RestockNotifyButton";
import { ProductViewTracker } from "@/components/analytics/product-view-tracker";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return products.map((p) => ({ slug: p.slug }));
  } catch (error) {
    // During build, if database is unavailable, return empty array
    // Pages will be generated on-demand instead of at build time
    console.warn('Unable to fetch products for static generation:', error);
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);
    if (!product) return {};
    return {
      title: product.metaTitle ?? product.name,
      description: product.metaDescription ?? product.shortDescription ?? product.description,
    };
  } catch (error) {
    console.warn("Unable to fetch product metadata:", error);
    return {};
  }
}

function convertStockStatus(status: string): StockStatus {
  return status.toLowerCase() as StockStatus;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: Awaited<ReturnType<typeof getProductBySlug>> = null;
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    console.warn("Unable to fetch product:", error);
  }
  if (!product) notFound();

  const allComparisons = [
    ...product.comparisons.map((c) => ({
      otherProduct: c.productB,
      summary: c.summary,
    })),
    ...product.comparedBy.map((c) => ({
      otherProduct: c.productA,
      summary: c.summary,
    })),
  ];

  return (
    <div className="py-12">
      <ProductViewTracker
        itemId={product.id}
        itemName={product.name}
        price={product.price ?? 0}
        category={product.category}
      />
      <div className="container max-w-4xl">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          {product.imageUrl && (
            <div className="relative w-full md:w-80 h-64 rounded-lg overflow-hidden shrink-0">
              <Image
                src={product.imageUrl}
                alt={product.imageAlt ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 320px"
                priority
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start gap-3 mb-3">
              <Badge variant="secondary" className="capitalize">
                {product.category}
              </Badge>
              <StockBadge status={convertStockStatus(product.stockStatus)} />
              {product.altNames.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Also known as: {product.altNames.join(", ")}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold font-heading mb-3">
              {product.name}
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              {product.description}
            </p>

            {/* Seasonal Message */}
            {product.stockStatus.toLowerCase() === 'seasonal' && product.seasonalMessage && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-900">{product.seasonalMessage}</p>
              </div>
            )}

            {/* Pricing */}
            <div className="flex flex-wrap gap-3">
              {product.price != null && product.price > 0 && (
                <div className="bg-primary/10 rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per {product.unit} (Muskingum Materials)
                  </div>
                </div>
              )}
              {product.marketPriceLowPerTon != null && (
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="text-lg font-semibold">
                    ${product.marketPriceLowPerTon}-${product.marketPriceHighPerTon}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per ton (market range)
                  </div>
                </div>
              )}
              {product.marketPriceLowPerYard != null && (
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="text-lg font-semibold">
                    ${product.marketPriceLowPerYard}-${product.marketPriceHighPerYard}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    per yard (market range)
                  </div>
                </div>
              )}
            </div>

            {/* Out of Stock Notification */}
            {product.stockStatus.toLowerCase() === 'out_of_stock' && (
              <RestockNotifyButton
                productId={product.id}
                productName={product.name}
              />
            )}
          </div>
        </div>

        {/* Is This Right For You */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {product.bestFor.length > 0 && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  Best For
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.bestFor.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {product.notFor.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <X className="h-5 w-5 text-red-600" />
                  Not Recommended For
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.notFor.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <X className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Common Uses */}
        {product.commonUses.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Common Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.commonUses.map((use) => (
                  <Badge key={use} variant="secondary">
                    {use}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {product.pros.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Pros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.pros.map((pro) => (
                    <li key={pro} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {product.cons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsDown className="h-5 w-5 text-amber-600" />
                  Cons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {product.cons.map((con) => (
                    <li key={con} className="flex items-start gap-2 text-sm">
                      <X className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Size and Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {product.sizeDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.sizeDescription}</p>
              </CardContent>
            </Card>
          )}
          {product.colorDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.colorDescription}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Comparisons */}
        {allComparisons.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-heading mb-4 flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Compare With Similar Materials
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {allComparisons.map((comp) => (
                <Link
                  key={comp.otherProduct.id}
                  href={`/catalog/${comp.otherProduct.slug}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">
                            {product.name} vs. {comp.otherProduct.name}
                          </h3>
                          {comp.summary && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {comp.summary}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          Compare
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            Ready to Order {product.name}?
          </h2>
          <p className="text-muted-foreground mb-4">
            Contact Muskingum Materials for pricing, availability, and delivery
            in Southeast Ohio.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={`tel:${BUSINESS_INFO.phone.replace(/\D/g, "")}`}>
              <Button size="lg" className="gap-2">
                <Phone className="h-4 w-4" />
                Call {BUSINESS_INFO.phone}
              </Button>
            </a>
            <Link href="/calculators/gravel-calculator">
              <Button size="lg" variant="outline">
                Calculate How Much You Need
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
