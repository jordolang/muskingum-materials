import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMAGE_MAP: Record<string, { url: string; alt: string }> = {
  "bank-run": {
    url: "https://images.unsplash.com/photo-1586157522512-fbd89f0a6c3c?w=800&q=80&auto=format&fit=crop",
    alt: "Natural bank run gravel with mixed sand and small stones",
  },
  "fill-dirt": {
    url: "https://images.unsplash.com/photo-1474220603372-f05977f8a805?w=800&q=80&auto=format&fit=crop",
    alt: "Tan fill dirt subsoil material",
  },
  "fill-sand-washed": {
    url: "https://images.unsplash.com/photo-1622405422946-5a9bd32e97e5?w=800&q=80&auto=format&fit=crop",
    alt: "Clean washed fill sand for construction and bedding",
  },
  "topsoil-unprocessed": {
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80&auto=format&fit=crop",
    alt: "Rich dark brown unprocessed topsoil for landscaping",
  },
  "4-fractured-gravel-washed": {
    url: "https://images.unsplash.com/photo-1631407251568-1d7d46fefe08?w=800&q=80&auto=format&fit=crop",
    alt: "Large washed fractured #4 gravel, 1.5 to 2.5 inches",
  },
  "9-gravel-washed": {
    url: "https://images.unsplash.com/photo-1559621768-63898afd1de8?w=800&q=80&auto=format&fit=crop",
    alt: "Fine washed #9 gravel for pipe bedding and drainage",
  },
  "8-gravel-washed": {
    url: "https://images.unsplash.com/photo-1559621768-63898afd1de8?w=800&q=80&auto=format&fit=crop",
    alt: "Washed #8 gravel, 3/8 to 1/2 inch angular crushed stone",
  },
  "57-gravel-washed": {
    url: "https://images.unsplash.com/photo-1631407251568-1d7d46fefe08?w=800&q=80&auto=format&fit=crop",
    alt: "Washed #57 gravel stones, 3/4 to 1 inch angular crushed stone",
  },
  "304-crushed-gravel": {
    url: "https://images.unsplash.com/photo-1632787955081-7b2b401f0d45?w=800&q=80&auto=format&fit=crop",
    alt: "Crushed #304 limestone aggregate that compacts solid",
  },
  "oversized-gravel-washed": {
    url: "https://images.unsplash.com/photo-1700758193234-7cc3ded52ff8?w=800&q=80&auto=format&fit=crop",
    alt: "Large oversized washed gravel stones for drainage and erosion control",
  },
  "57-limestone": {
    url: "https://images.unsplash.com/photo-1601274173564-4fc9c4f31f80?w=800&q=80&auto=format&fit=crop",
    alt: "Premium #57 crushed limestone aggregate",
  },
};

async function main() {
  for (const [slug, image] of Object.entries(IMAGE_MAP)) {
    await prisma.product.update({
      where: { slug },
      data: {
        imageUrl: image.url,
        imageAlt: image.alt,
      },
    });
  }
  const updated = await prisma.product.count({ where: { imageUrl: { not: null } } });
  process.stdout.write(`Updated ${updated} products with images\n`);
}

main()
  .catch((e) => {
    process.stderr.write(String(e) + "\n");
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
