import type { CostGuide, Prisma, Product, Service } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const productWithComparisonsInclude = {
  comparisons: { include: { productB: true } },
  comparedBy: { include: { productA: true } },
} as const satisfies Prisma.ProductInclude;

type ProductWithComparisons = Prisma.ProductGetPayload<{
  include: typeof productWithComparisonsInclude;
}>;

// Preview Vercel deployments run `next build` without a DATABASE_URL because
// the Neon preview branch isn't wired into the build env. Short-circuiting
// here lets those builds succeed — pages fall back to empty catalogs and
// render dynamically at request time. Production always has DATABASE_URL,
// so this is a no-op there. See docs/bundle-isolation.md's sibling note in
// PR history if reviving.
const hasDatabase = (): boolean => Boolean(process.env.DATABASE_URL);

export interface ProductFilters {
  search?: string;
  category?: string;
  sortBy?: "name-asc" | "name-desc" | "price-asc" | "price-desc";
}

export async function getProductsWithFilters(
  filters: ProductFilters = {},
): Promise<Product[]> {
  if (!hasDatabase()) return [];
  const { search, category, sortBy } = filters;

  const where: Prisma.ProductWhereInput = { active: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { shortDescription: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.category = category;
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { sortOrder: "asc" };
  if (sortBy === "name-asc") {
    orderBy = { name: "asc" };
  } else if (sortBy === "name-desc") {
    orderBy = { name: "desc" };
  } else if (sortBy === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sortBy === "price-desc") {
    orderBy = { price: "desc" };
  }

  return prisma.product.findMany({ where, orderBy });
}

export async function getProducts(): Promise<Product[]> {
  if (!hasDatabase()) return [];
  return prisma.product.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!hasDatabase()) return [];
  return prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithComparisons | null> {
  if (!hasDatabase()) return null;
  return prisma.product.findUnique({
    where: { slug },
    include: productWithComparisonsInclude,
  });
}

export async function getProductsByCategory(
  category: string,
): Promise<Product[]> {
  if (!hasDatabase()) return [];
  return prisma.product.findMany({
    where: { active: true, category },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCostGuides(): Promise<CostGuide[]> {
  if (!hasDatabase()) return [];
  return prisma.costGuide.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCostGuideBySlug(
  slug: string,
): Promise<CostGuide | null> {
  if (!hasDatabase()) return null;
  return prisma.costGuide.findUnique({
    where: { slug },
  });
}

export async function getServices(): Promise<Service[]> {
  if (!hasDatabase()) return [];
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (!hasDatabase()) return null;
  return prisma.service.findUnique({
    where: { slug },
  });
}
