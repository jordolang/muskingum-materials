import { prisma } from "@/lib/prisma";

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

export async function getServices() {
  return prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getServiceBySlug(slug: string) {
  return prisma.service.findUnique({
    where: { slug },
  });
}
