import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Local, material-accurate product photography. Each image matches the
// gradation, angularity, and color documented for that product in
// docs/material-image-research.md (ODOT Item 703 / producer references).
const IMAGE_MAP: Record<string, { url: string; alt: string }> = {
  "bank-run": {
    url: "/images/products/bank-run.jpg",
    alt: "Unprocessed bank run — brown sand and rounded river gravel mix straight from the bank",
  },
  "fill-dirt": {
    url: "/images/products/fill-dirt.jpg",
    alt: "Clean brown fill dirt subsoil, free of organic matter, screened of debris",
  },
  "fill-sand-washed": {
    url: "/images/products/fill-sand-washed.jpg",
    alt: "Washed fill sand — clean tan construction sand for backfill and bedding",
  },
  "topsoil-unprocessed": {
    url: "/images/products/topsoil-unprocessed.jpg",
    alt: "Dark brown unprocessed topsoil for landscaping and lawn establishment",
  },
  "asphalt-millings": {
    url: "/images/products/asphalt-millings.jpg",
    alt: "Black recycled asphalt millings with visible bitumen-coated aggregate",
  },
  "9-gravel-washed": {
    url: "/images/products/9-gravel-washed.jpg",
    alt: "Washed #9 gravel — fine 1/8 to 3/16 inch pea-sized aggregate for pipe bedding",
  },
  "8-gravel-washed": {
    url: "/images/products/8-gravel-washed.jpg",
    alt: "Washed #8 gravel — 3/8 inch rounded river gravel for walkways and paver bases",
  },
  "57-gravel-washed": {
    url: "/images/products/57-gravel-washed.jpg",
    alt: "Washed #57 gravel — 3/4 to 1 inch mixed-color rounded river gravel",
  },
  "304-crushed-gravel": {
    url: "/images/products/304-crushed-gravel.jpg",
    alt: "Crushed 304s gravel — dense-graded angular gravel with fines that compacts solid",
  },
  "4-crushed-gravel": {
    url: "/images/products/4-crushed-gravel.jpg",
    alt: "Crushed #4 gravel — angular fractured stone 1.5 to 2.5 inches",
  },
  "oversized-gravel-washed": {
    url: "/images/products/oversized-gravel-washed.jpg",
    alt: "Washed oversized gravel — large smooth river rock for drainage and erosion control",
  },
  "304-limestone": {
    url: "/images/products/304-limestone.jpg",
    alt: "ODOT #304 crushed limestone — gray dense-graded aggregate with fines for road base",
  },
  "57-limestone": {
    url: "/images/products/57-limestone.jpg",
    alt: "Washed #57 crushed limestone — light gray angular 3/4 to 1 inch aggregate",
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
