import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMAGE_MAP: Record<string, { url: string; alt: string }> = {
  "57-gravel": {
    url: "https://images.unsplash.com/photo-1631407251568-1d7d46fefe08?w=800&q=80&auto=format&fit=crop",
    alt: "Angular crushed #57 gravel stones, 3/4 to 1 inch in size",
  },
  "8-gravel": {
    url: "https://images.unsplash.com/photo-1559621768-63898afd1de8?w=800&q=80&auto=format&fit=crop",
    alt: "Small crushed #8 gravel, 3/8 to 1/2 inch angular stone",
  },
  "8-fractured-gravel": {
    url: "https://images.unsplash.com/photo-1631407251568-1d7d46fefe08?w=800&q=80&auto=format&fit=crop",
    alt: "Washed fractured gravel with angular edges",
  },
  "89-stone": {
    url: "https://images.unsplash.com/photo-1559621768-63898afd1de8?w=800&q=80&auto=format&fit=crop",
    alt: "Fine angular #89 crushed stone, 3/8 inch and smaller",
  },
  "411-gravel": {
    url: "https://images.unsplash.com/photo-1632787955081-7b2b401f0d45?w=800&q=80&auto=format&fit=crop",
    alt: "Blended #411 gravel aggregate with stone and fines",
  },
  "bank-run-gravel": {
    url: "https://images.unsplash.com/photo-1586157522512-fbd89f0a6c3c?w=800&q=80&auto=format&fit=crop",
    alt: "Natural bank run gravel with mixed sand and small stones",
  },
  "crushed-limestone": {
    url: "https://images.unsplash.com/photo-1601274173564-4fc9c4f31f80?w=800&q=80&auto=format&fit=crop",
    alt: "Pale gray crushed limestone fragments",
  },
  "crushed-stone": {
    url: "https://images.unsplash.com/photo-1632787955081-7b2b401f0d45?w=800&q=80&auto=format&fit=crop",
    alt: "Angular gray crushed stone aggregate",
  },
  "crusher-run": {
    url: "https://images.unsplash.com/photo-1677099240091-fda6c59a4609?w=800&q=80&auto=format&fit=crop",
    alt: "Crusher run aggregate blend of crushed stone and stone dust",
  },
  "decomposed-granite": {
    url: "https://images.unsplash.com/photo-1560755572-8b0fb6f23272?w=800&q=80&auto=format&fit=crop",
    alt: "Gold and tan decomposed granite material",
  },
  "pea-gravel": {
    url: "https://images.unsplash.com/photo-1559621768-63898afd1de8?w=800&q=80&auto=format&fit=crop",
    alt: "Small rounded pea gravel stones in mixed natural colors",
  },
  "river-rock": {
    url: "https://images.unsplash.com/photo-1455243629161-1f993797f78d?w=800&q=80&auto=format&fit=crop",
    alt: "Smooth rounded river rocks in various sizes and colors",
  },
  "fill-dirt": {
    url: "https://images.unsplash.com/photo-1474220603372-f05977f8a805?w=800&q=80&auto=format&fit=crop",
    alt: "Tan fill dirt subsoil material",
  },
  topsoil: {
    url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80&auto=format&fit=crop",
    alt: "Rich dark brown topsoil for gardening and landscaping",
  },
  "fill-sand": {
    url: "https://images.unsplash.com/photo-1622405422946-5a9bd32e97e5?w=800&q=80&auto=format&fit=crop",
    alt: "Tan granular fill sand",
  },
  "washed-sand": {
    url: "https://images.unsplash.com/photo-1622405422946-5a9bd32e97e5?w=800&q=80&auto=format&fit=crop",
    alt: "Clean washed sand for construction and masonry",
  },
  "stone-dust": {
    url: "https://images.unsplash.com/photo-1560755572-8b0fb6f23272?w=800&q=80&auto=format&fit=crop",
    alt: "Fine gray stone dust particles",
  },
  "rip-rap": {
    url: "https://images.unsplash.com/photo-1700758193234-7cc3ded52ff8?w=800&q=80&auto=format&fit=crop",
    alt: "Large angular rip rap stones for erosion control",
  },
  "recycled-asphalt": {
    url: "https://images.unsplash.com/photo-1741996950842-c3a280a438a4?w=800&q=80&auto=format&fit=crop",
    alt: "Dark recycled asphalt millings",
  },
  "washed-gravel": {
    url: "https://images.unsplash.com/photo-1631407251568-1d7d46fefe08?w=800&q=80&auto=format&fit=crop",
    alt: "Clean washed gravel aggregate",
  },
  "construction-gravel": {
    url: "https://images.unsplash.com/photo-1677099240091-fda6c59a4609?w=800&q=80&auto=format&fit=crop",
    alt: "Mixed construction gravel aggregate",
  },
  compost: {
    url: "https://images.unsplash.com/photo-1649577193391-f13d769d011d?w=800&q=80&auto=format&fit=crop",
    alt: "Rich dark compost organic matter",
  },
  "landscape-rock": {
    url: "https://images.unsplash.com/photo-1455243629161-1f993797f78d?w=800&q=80&auto=format&fit=crop",
    alt: "Decorative landscape rocks in natural earth tones",
  },
  "4-gravel": {
    url: "https://images.unsplash.com/photo-1632787955081-7b2b401f0d45?w=800&q=80&auto=format&fit=crop",
    alt: "Large #4 gravel stones, 1.5 to 2.5 inches",
  },
  "9-gravel": {
    url: "https://images.unsplash.com/photo-1559621768-63898afd1de8?w=800&q=80&auto=format&fit=crop",
    alt: "Fine #9 washed gravel for pipe bedding",
  },
  "oversized-gravel": {
    url: "https://images.unsplash.com/photo-1700758193234-7cc3ded52ff8?w=800&q=80&auto=format&fit=crop",
    alt: "Large oversized washed gravel stones",
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
