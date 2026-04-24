"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Mail, CheckCircle2 } from "lucide-react";
import type { RecommendationWithDetails } from "@/lib/recommendations";
import Image from "next/image";

interface RecommendationResultsProps {
  recommendations: RecommendationWithDetails[];
  onAddToCart?: (productSlug: string, quantity: number) => void;
  onRequestQuote?: (productSlug: string, quantity: number) => void;
}

export function RecommendationResults({
  recommendations,
  onAddToCart,
  onRequestQuote,
}: RecommendationResultsProps) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No recommendations available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => {
        const product = rec.product;
        const isTopChoice = index === 0;

        return (
          <Card
            key={rec.productSlug}
            className={isTopChoice ? "border-primary/50 shadow-md" : ""}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isTopChoice && (
                      <Badge className="bg-primary">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Best Match
                      </Badge>
                    )}
                    {!isTopChoice && (
                      <Badge variant="outline">Option {index + 1}</Badge>
                    )}
                    <Badge variant="secondary">Priority {rec.priority}</Badge>
                  </div>
                  <CardTitle className="text-xl">
                    {product?.name || rec.productSlug}
                  </CardTitle>
                  {product?.shortDescription && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {product.shortDescription}
                    </p>
                  )}
                </div>
                {product?.imageUrl && (
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border">
                    <Image
                      src={product.imageUrl}
                      alt={product.imageAlt || product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Why We Recommend This */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">
                  Why We Recommend This
                </h4>
                <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                {rec.idealFor && rec.idealFor.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-1.5">Ideal For:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {rec.idealFor.map((use, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {use}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Quantity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {product?.price && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Price per {product.unit || "ton"}
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">
                    Est. Quantity
                  </div>
                  <div className="text-lg font-bold">
                    {rec.estimatedQuantity} {product?.unit || "tons"}
                  </div>
                </div>
                {rec.estimatedCost && (
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Est. Total
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ${rec.estimatedCost.toFixed(2)}
                    </div>
                  </div>
                )}
                <div className="flex items-end">
                  <p className="text-xs text-muted-foreground">
                    Material only, delivery extra
                  </p>
                </div>
              </div>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {onAddToCart && product && (
                  <Button
                    onClick={() => onAddToCart(rec.productSlug, rec.estimatedQuantity)}
                    size="lg"
                    className="flex-1"
                    variant={isTopChoice ? "default" : "secondary"}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                )}
                {onRequestQuote && (
                  <Button
                    onClick={() =>
                      onRequestQuote(rec.productSlug, rec.estimatedQuantity)
                    }
                    size="lg"
                    variant="outline"
                    className="flex-1"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Request Quote
                  </Button>
                )}
              </div>

              {/* Additional Info */}
              {!onAddToCart && !onRequestQuote && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Ready to order?</strong> Call us at{" "}
                    <a
                      href="tel:7403190183"
                      className="font-semibold underline"
                    >
                      (740) 319-0183
                    </a>{" "}
                    or visit our location to discuss your project.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* General Disclaimer */}
      <div className="text-xs text-muted-foreground text-center mt-6 p-4 bg-muted/30 rounded-lg">
        <p>
          <strong>Note:</strong> Quantities are estimates based on typical project requirements.
          Actual needs may vary based on site conditions, material settling, and application method.
          Prices shown are current material costs and do not include delivery fees.
          Contact us for exact pricing and delivery options for your location.
        </p>
      </div>
    </div>
  );
}
