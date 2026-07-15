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
  size: string;
  uses: string[];
  availability: string;
}

const STOCK_LABELS: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Limited",
  OUT_OF_STOCK: "Out of stock",
  SEASONAL: "Seasonal",
};

// Static fallback from the canonical product list so the page still renders
// if the database is unreachable (missing DATABASE_URL in a preview deploy,
// transient Neon outage, etc.) instead of crashing the whole page. The spec
// columns the DB carries (size, uses, stock) aren't in the static list, so
// they read as "—" rather than being guessed at.
function getFallbackProducts(): Product[] {
  return PRODUCTS.map((product) => ({
    // Synthetic key, prefixed to stay clearly distinct from DB primary keys.
    _id: `static-${product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`,
    name: product.name,
    description: product.description,
    category: product.category,
    size: "",
    uses: [],
    availability: "",
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
        sizeDescription: true,
        commonUses: true,
        stockStatus: true,
        seasonalMessage: true,
      },
    });

    const products: Product[] = productRows.map((row) => ({
      _id: row.id,
      name: row.name,
      description: row.shortDescription ?? row.description,
      category: row.category,
      size: row.sizeDescription ?? "",
      uses: row.commonUses,
      availability:
        row.seasonalMessage ?? STOCK_LABELS[row.stockStatus] ?? "",
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

  // Gravel leads — it's what contractors come here for most.
  const categories = ["gravel", "fill", "limestone"] as const;

  return (
    <div className="py-12">
      <div className="container max-w-5xl">
        <div className="mb-8">
          <h1 className="mb-2 font-heading text-3xl font-bold">
            Material Data Sheet
          </h1>
          <p className="text-sm text-muted-foreground">
            State approved sand, gravel, and aggregate. Sold by the ton, weighed
            on state-approved scales. Call for pricing and availability.
          </p>
        </div>

        {categories.map((category) => {
          const group = products.filter((p) => p.category === category);
          if (group.length === 0) return null;
          return (
            <section key={category} className="mb-10">
              <h2 className="mb-2 font-heading text-lg font-bold uppercase tracking-wide">
                {CATEGORY_LABELS[category] ?? category}
              </h2>
              {/* Plain spec table. Scrolls sideways on a phone rather than
                  reflowing into cards — the columns stay lined up. */}
              <div className="overflow-x-auto border border-stone-300">
                <table className="w-full min-w-[46rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-300 bg-stone-100 text-left">
                      <th className="px-3 py-2 font-semibold">Material</th>
                      <th className="px-3 py-2 font-semibold">
                        Size / Gradation
                      </th>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="px-3 py-2 font-semibold">Typical Uses</th>
                      <th className="px-3 py-2 font-semibold">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((product) => (
                      <tr
                        key={product._id}
                        className="border-b border-stone-200 align-top last:border-b-0"
                      >
                        <td className="px-3 py-2 font-semibold whitespace-nowrap">
                          {product.name}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {product.size || "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {product.description}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {product.uses.length > 0
                            ? product.uses.join(", ")
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {product.availability || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <div className="border border-stone-300 bg-stone-50 p-5">
          <h2 className="mb-1 font-heading text-lg font-bold">
            Pricing &amp; Availability
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Loads up to 20 tons. Delivery quoted by destination.{" "}
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
