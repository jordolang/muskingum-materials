import type { Metadata } from "next";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS_INFO, PRODUCTS } from "@/data/business";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateProductsMetadata } from "@/lib/seo/metadata";

// Revalidate hourly so product edits in the database surface on the
// statically generated page within an hour without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = generateProductsMetadata();

interface Product {
  _id: string;
  name: string;
  description: string;
  category: string;
}

// Static fallback from the canonical product list so the page still renders
// if the database is unreachable (missing DATABASE_URL in a preview deploy,
// transient Neon outage, etc.) instead of crashing the whole page.
function getFallbackProducts(): Product[] {
  return PRODUCTS.map((product) => ({
    // Synthetic key, prefixed to stay clearly distinct from DB primary keys.
    _id: `static-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    name: product.name,
    description: product.description,
    category: product.category,
  }));
}

async function getProducts(): Promise<Product[]> {
  try {
    const productRows = await prisma.product.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      select: {
        id: true,
        name: true,
        shortDescription: true,
        description: true,
        category: true,
      },
    });

    const products: Product[] = productRows.map((row) => ({
      _id: row.id,
      name: row.name,
      description: row.shortDescription ?? row.description,
      category: row.category,
    }));

    return products.length > 0 ? products : getFallbackProducts();
  } catch (error) {
    logger.error(
      "Products page: failed to load products from database, using static fallback",
      error,
    );
    return getFallbackProducts();
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  fill: "Sand & Fill",
  gravel: "Gravel",
  limestone: "Aggregate",
};

export default async function ProductsPage() {
  const products = await getProducts();
  const phone = BUSINESS_INFO.phone;
  const phoneHref = `tel:${phone.replace(/\D/g, "")}`;

  const categories = ["fill", "gravel", "limestone"] as const;

  return (
    <div className="py-12">
      <div className="container max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="mb-3 font-heading text-4xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            State approved sand, gravel, and aggregate. Call for pricing and
            availability.
          </p>
        </div>

        {categories.map((category) => {
          const group = products.filter((p) => p.category === category);
          if (group.length === 0) return null;
          return (
            <div key={category} className="mb-10">
              <h2 className="mb-4 font-heading text-2xl font-bold">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              <ul className="divide-y rounded-2xl border bg-background shadow-sm">
                {group.map((product) => (
                  <li key={product._id} className="px-6 py-4">
                    <div className="font-semibold">{product.name}</div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        <div className="mt-8 rounded-2xl bg-muted/50 p-8 text-center">
          <h2 className="mb-3 font-heading text-2xl font-bold">
            Call for Material Availability and Free Estimates
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            {BUSINESS_INFO.hours}
          </p>
          <a href={phoneHref}>
            <Button className="gap-2">
              <Phone className="h-4 w-4" />
              Call {phone}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
