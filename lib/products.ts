import { prisma } from "@/lib/prisma";

export interface ProductFilters {
  search?: string;
  category?: string;
  sortBy?: "name-asc" | "name-desc" | "price-asc" | "price-desc";
}

export async function getProductsWithFilters(filters: ProductFilters = {}) {
  const { search, category, sortBy } = filters;

  const where: any = { active: true };

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

  let orderBy: any = { sortOrder: "asc" };
  if (sortBy === "name-asc") {
    orderBy = { name: "asc" };
  } else if (sortBy === "name-desc") {
    orderBy = { name: "desc" };
  } else if (sortBy === "price-asc") {
    orderBy = { price: "asc" };
  } else if (sortBy === "price-desc") {
    orderBy = { price: "desc" };
  }

  return prisma.product.findMany({
    where,
    orderBy,
  });
}

export async function getProducts() {
  return prisma.product.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { active: true, featured: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      comparisons: {
        include: { productB: true },
      },
      comparedBy: {
        include: { productA: true },
      },
    },
  });
}

export async function getProductsByCategory(category: string) {
  return prisma.product.findMany({
    where: { active: true, category },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCostGuides() {
  return prisma.costGuide.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCostGuideBySlug(slug: string) {
  return prisma.costGuide.findUnique({
    where: { slug },
  });
}
