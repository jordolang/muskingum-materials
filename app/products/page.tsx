import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCTS, BUSINESS_INFO } from "@/data/business";
import { prisma } from "@/lib/prisma";
import { generateProductSchema, toJsonLd } from "@/lib/seo/structured-data";
import { generateProductsMetadata } from "@/lib/seo/metadata";

// Revalidate hourly so price/SKU edits in the database surface on the
// statically generated page within an hour without a redeploy.
export const revalidate = 3600;

export const metadata: Metadata = generateProductsMetadata();

interface Product {
  _id: string;
  name: string;
  description: string;
  pricePerTon: number;
  unit: string;
  category: string;
}

export default async function ProductsPage() {
  const productRows = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      shortDescription: true,
      description: true,
      price: true,
      unit: true,
      category: true,
    },
  });

  const products: Product[] = productRows.map((row) => ({
    _id: row.id,
    name: row.name,
    description: row.shortDescription ?? row.description,
    pricePerTon: row.price ?? 0,
    unit: row.unit,
    category: row.category,
  }));

  const phone = BUSINESS_INFO.phone;

  const grouped = {
    gravel: products.filter((p) => p.category === "gravel"),
    sand: products.filter((p) => p.category === "sand"),
    soil: products.filter((p) => p.category === "soil"),
    stone: products.filter((p) => p.category === "stone"),
  };

  return (
    <>
      {/* Product Structured Data */}
      {PRODUCTS.map((product) => (
        <script
          key={product.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: toJsonLd(generateProductSchema(product)),
          }}
        />
      ))}

      <div className="py-12">
        <div className="container">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold font-heading mb-3">
            Products & Pricing
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Current pricing effective 07/01/2025. Prices subject to change - call
            for most recent pricing. Tax of 7.25% applies. Credit card processing
            fee of 4.5% per ticket.
          </p>
        </div>

        {/* Pricing Table */}
        <div className="mb-12">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-stone-800 text-white">
                  <th className="px-4 py-3 text-left font-semibold">Product</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-right font-semibold">Price</th>
                  <th className="px-4 py-3 text-right font-semibold">Unit</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => {
                  const orderable = product.pricePerTon > 0;
                  const rowClass = `border-b ${i % 2 === 0 ? "bg-background" : "bg-muted/30"}`;
                  const cells = (
                    <>
                      <td className={`px-4 py-3 font-medium ${orderable ? "hover:bg-amber-50 cursor-pointer" : ""}`}>
                        {orderable ? (
                          <Link
                            href={`/order?product=${encodeURIComponent(product.name)}`}
                            className="text-primary hover:underline block"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          product.name
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="capitalize">
                          {product.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">
                        {orderable
                          ? `$${product.pricePerTon.toFixed(2)}`
                          : "Call for Pricing"}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground capitalize">
                        {product.unit === "call" ? "—" : `Per ${product.unit}`}
                      </td>
                    </>
                  );
                  return (
                    <tr key={product._id} className={rowClass}>
                      {cells}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Cards by Category */}
        {Object.entries(grouped).map(([category, products]) => (
          <div key={category} className="mb-12">
            <h2 className="text-2xl font-bold font-heading mb-6 capitalize">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const card = (
                  <Card className="hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg leading-tight">
                          {product.name}
                        </h3>
                        <div className="text-right shrink-0 ml-3">
                          {product.pricePerTon > 0 ? (
                            <span className="text-xl font-bold text-primary">
                              ${product.pricePerTon.toFixed(2)}
                              <span className="text-xs text-muted-foreground font-normal block">
                                per {product.unit}
                              </span>
                            </span>
                          ) : (
                            <Badge>Call for Price</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </CardContent>
                  </Card>
                );
                return product.pricePerTon > 0 ? (
                  <Link
                    key={product._id}
                    href={`/order?product=${encodeURIComponent(product.name)}`}
                    aria-label={`Order ${product.name}`}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={product._id}>{card}</div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Additional Info */}
        <div className="bg-muted/50 rounded-lg p-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Pricing Notes</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>* Prices effective 07/01/2025</li>
                <li>* Prices subject to change — call for most recent pricing</li>
                <li>* Ohio sales tax of 7.25% applies</li>
                <li>* Credit card processing fee of 4.5% per ticket</li>
                <li>* Delivery rates available upon request</li>
                <li>* Volume discounts for large projects</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">
                Ready to Order?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Call us today to place your order or get a custom quote for your
                project. We offer volume discounts for large orders.
              </p>
              <a href={`tel:${phone.replace(/\D/g, "")}`}>
                <Button className="gap-2">
                  <Phone className="h-4 w-4" />
                  Call {phone}
                </Button>
              </a>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
