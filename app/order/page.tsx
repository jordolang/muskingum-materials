import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderForm, type OrderableProduct } from "@/components/order/order-form";
import { ErrorBoundary } from "@/components/error-boundary";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { PRODUCTS, PRODUCT_IMAGES } from "@/data/business";
import { auth } from "@clerk/nextjs/server";

export const metadata: Metadata = {
  title: "Order Materials Online",
  description:
    "Order sand, gravel, soil, and stone online from Muskingum Materials. Estimate your project, choose products, and pay securely with Stripe.",
};

// Revalidate every 5 minutes so price edits in Postgres flow to the order
// page without a redeploy.
export const revalidate = 300;

// Static fallback derived from the canonical price list in data/business.ts.
// If the database is unreachable at build/runtime (e.g. a missing
// DATABASE_URL in a preview deploy, or a transient Neon outage) the order
// page used to throw and render the generic "Something went wrong" error
// screen. Falling back to the published catalog keeps the page usable —
// customers can still browse, estimate, and reach us — instead of hitting a
// dead end. Mirrors the graceful-degradation pattern used elsewhere in the app.
function getFallbackProducts(): OrderableProduct[] {
  return PRODUCTS.filter((product) => product.price > 0).map((product) => ({
    // Prefix synthetic IDs so they're clearly distinct from real database
    // primary keys. The id is only used as a React key here — the cart and
    // checkout flow key off the product name, not this id.
    id: `static-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    name: product.name,
    description: product.description,
    price: product.price,
    unit: product.unit,
    imageUrl: PRODUCT_IMAGES[product.name],
    imageAlt: product.name,
  }));
}

async function getOrderableProducts(): Promise<OrderableProduct[]> {
  try {
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

    // An empty catalog (DB reachable but unseeded) is just as broken to a
    // shopper as a hard failure — fall back to the published price list.
    return products.length > 0 ? products : getFallbackProducts();
  } catch (error) {
    logger.error(
      "Order page: failed to load products from database, using static fallback",
      error,
    );
    return getFallbackProducts();
  }
}

export default async function OrderPage() {
  const products = await getOrderableProducts();

  // Fetch user profile if authenticated to check for contractor approval
  const { userId } = await auth();
  let userProfile = null;

  if (userId) {
    try {
      userProfile = await prisma.userProfile.findUnique({
        where: { userId },
        select: {
          isContractor: true,
          netTermsApproved: true,
          netTermsCreditLimit: true,
          netTermsLength: true,
        },
      });
    } catch (error) {
      logger.warn(
        "Order page: failed to load user profile, payment options will be limited",
        { error },
      );
    }
  }

  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Order Materials Online
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We&apos;ll guide you step-by-step: estimate your project, pick your
            materials, choose pickup or delivery, and pay securely.
          </p>
        </div>

        <ErrorBoundary componentName="OrderForm">
          <Suspense fallback={null}>
            <OrderForm products={products} userProfile={userProfile} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}
