import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderForm, type OrderableProduct } from "@/components/order/order-form";
import { MaterialCalculator } from "@/components/order/material-calculator";
import { ErrorBoundary } from "@/components/error-boundary";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Order Materials Online",
  description:
    "Order sand, gravel, soil, and stone online from Muskingum Materials. Calculate your needs, choose products, and pay securely with Stripe.",
};

// Revalidate every 5 minutes so price edits in Postgres flow to the order
// page without a redeploy.
export const revalidate = 300;

export default async function OrderPage() {
  const productRows = await prisma.product.findMany({
    where: { active: true, price: { gt: 0 } },
    orderBy: [{ sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      price: true,
      unit: true,
      imageUrl: true,
      imageAlt: true,
    },
  });

  const products: OrderableProduct[] = productRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.shortDescription ?? row.description,
    price: row.price ?? 0,
    unit: row.unit,
    imageUrl: row.imageUrl ?? undefined,
    imageAlt: row.imageAlt ?? undefined,
  }));

  return (
    <div className="py-12">
      <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Order Materials Online
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your products, calculate how much you need, and pay securely
            online. Pick up at our yard or request delivery.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Calculator - Left Side */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <ErrorBoundary componentName="MaterialCalculator">
                <MaterialCalculator />
              </ErrorBoundary>
            </div>
          </div>

          {/* Order Form - Right Side */}
          <div className="lg:col-span-3">
            <ErrorBoundary componentName="OrderForm">
              <Suspense fallback={null}>
                <OrderForm products={products} />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
