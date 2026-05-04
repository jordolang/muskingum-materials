"use client";

import Image from "next/image";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { OrderableProduct } from "./order-form";

interface CartItem {
  name: string;
  price: number;
  unit: string;
  quantity: number;
}

interface ProductCatalogProps {
  products: OrderableProduct[];
  cart: CartItem[];
  onAddToCart: (product: { name: string; price: number; unit: string }) => void;
  onUpdateQuantity: (name: string, delta: number) => void;
  onSetQuantity: (name: string, qty: number) => void;
}

export function ProductCatalog({
  products,
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
            Choose your materials and quantity in tons.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {products.map((product) => {
              const inCart = cart.find((item) => item.name === product.name);
              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 transition-colors ${
                    inCart ? "bg-amber-50/50" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={product.imageUrl || "/images/photos/piles.jpg"}
                      alt={product.imageAlt || product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-amber-700">
                      ${product.price.toFixed(2)}
                      <span className="text-xs font-normal text-muted-foreground">
                        /{product.unit}
                      </span>
                    </p>
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
                            onSetQuantity(
                              product.name,
                              parseInt(e.target.value) || 0
                            )
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
                        onClick={() =>
                          onAddToCart({
                            name: product.name,
                            price: product.price,
                            unit: product.unit,
                          })
                        }
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
