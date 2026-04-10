"use client";

import Image from "next/image";
import { ShoppingCart, Plus, Minus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRODUCTS, PRODUCT_IMAGES } from "@/data/business";
import { getDisplayPrice, formatPricingTiers } from "@/lib/pricing-calculator";

const ORDERABLE_PRODUCTS = PRODUCTS.filter((p) => p.price > 0);

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface ProductCatalogProps {
  cart: CartItem[];
  onAddToCart: (product: (typeof ORDERABLE_PRODUCTS)[number]) => void;
  onUpdateQuantity: (name: string, delta: number) => void;
  onSetQuantity: (name: string, qty: number) => void;
}

export function ProductCatalog({
  cart,
  onAddToCart,
  onUpdateQuantity,
  onSetQuantity,
}: ProductCatalogProps) {
  return (
    <TooltipProvider>
      <Card className="shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-amber-600" />
          Select Products
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Choose your materials and quantity in tons. Prices effective 07/01/2025.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {ORDERABLE_PRODUCTS.map((product) => {
            const inCart = cart.find((item) => item.name === product.name);
            const hasTiers = product.pricingTiers && product.pricingTiers.length > 0;
            const displayPrice = getDisplayPrice(
              {
                name: product.name,
                pricePerTon: product.price,
                unit: product.unit,
                pricingTiers: product.pricingTiers
              }
            );
            const tierLabels = hasTiers ? formatPricingTiers({
              name: product.name,
              pricePerTon: product.price,
              unit: product.unit,
              pricingTiers: product.pricingTiers
            }) : [];

            return (
              <div
                key={product.name}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  inCart ? "bg-amber-50/50" : "hover:bg-muted/30"
                }`}
              >
                <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={PRODUCT_IMAGES[product.name] || "/images/photos/piles.jpg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.description}</p>
                </div>
                <div className="text-right shrink-0">
                  {hasTiers ? (
                    <div className="flex items-center gap-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Starting at</p>
                        <p className="font-bold text-amber-700">
                          ${displayPrice.toFixed(2)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /{product.unit}
                          </span>
                        </p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground">
                            <Info className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-xs">Volume Pricing</p>
                            {tierLabels.map((tier, idx) => (
                              <p key={idx} className="text-xs">{tier}</p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ) : (
                    <p className="font-bold text-amber-700">
                      ${product.price.toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground">
                        /{product.unit}
                      </span>
                    </p>
                  )}
                </div>
                <div className="shrink-0">
                  {inCart ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(product.name, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={inCart.quantity}
                        onChange={(e) =>
                          onSetQuantity(product.name, parseInt(e.target.value) || 0)
                        }
                        className="w-16 h-8 text-center text-sm"
                        min="0"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onUpdateQuantity(product.name, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddToCart(product)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
