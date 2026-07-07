# Material image research

Reference notes used to produce the product photography under
`public/images/products/`. Each image was matched against the gradation,
particle shape, and color documented below so the photo shown for a material
is visually correct for that specific product — not a generic gravel stock
photo.

Primary sources:

- **ODOT Construction & Material Specifications, Item 703 (Aggregate)** —
  Table 703.1-1 "Size of Coarse Aggregate (AASHTO M 43)" for the numbered
  sizes, and 703.17 for Item 304 dense-graded base gradation.
  <https://www.dot.state.oh.us/Divisions/ConstructionMgt/OnlineDocs/Specifications/2002CMS/Specbook2002/700%20Materials%20Details/703.htm>
- **ODOT Item 304** gradation: 2 in — 100% passing, 1 in — 70–100%,
  3/4 in — 50–90%, No. 4 — 30–60%, No. 30 — 9–33%, No. 200 — 0–15%.
- **Three Z Supply (Ohio)** — washed river gravel appearance: naturally
  occurring stone, "gray to brown to tan," rounded and smooth with no edges
  or corners because it is not crushed.
  <https://three-z.com/washed-river-gravel/>
- Muskingum Materials' own product descriptions (`prisma/seed.ts`), which
  carry the yard's size callouts (e.g. #4 at 1.5–2.5 in).

## What each image must show

### Sand & fill

| Material | Visual requirements |
| --- | --- |
| Bank Run | Unprocessed pit run: brown/tan sandy matrix with rounded mixed-size river gravel embedded throughout. Dirty, unwashed, unscreened. |
| Fill Dirt | Brown subsoil, clumpy, free of organic matter (no roots, no dark humus), some clay clods, no stones of note. |
| Washed Fill Sand | Clean tan-to-light-brown washed construction sand. Uniform fine grain, no clay clumps, no gravel, slightly damp look typical of washed sand. |
| Asphalt Millings (Unprocessed) | Black to very dark gray granular millings, roughly 1 in and smaller, angular chunks of bitumen-coated aggregate with visible broken black pavement pieces. Not shiny fresh asphalt; dry, dull black-gray. |
| Topsoil (Unprocessed) | Dark brown loam, unscreened, natural clumps, occasional small roots/organic flecks. Visibly darker and more organic than fill dirt. |

### Gravel (washed and crushed river gravel)

Local gravel is glacial-outwash river gravel: **rounded to sub-rounded,
smooth, mixed colors** (tan, brown, gray, rust, white quartz). "Washed" means
clean stone — no dust film, no sand fraction. "Crushed" river gravel shows
fractured faces on otherwise rounded parent stone.

| Material | ODOT/AASHTO gradation | Visual requirements |
| --- | --- | --- |
| Washed #9 Gravel | No. 9: passing No. 4 (4.75 mm) 100%, retained mostly on No. 16 | Very fine "bird's-eye" pea gravel, 1/8–3/16 in, rounded, mixed tan/gray/brown, clean. Grains clearly gravel (not sand) but small and uniform. |
| Washed #8 Gravel | No. 8: 3/8 in — 100% passing, No. 4 — 85–100% | Classic pea gravel: rounded smooth stones 3/16–3/8 in, mixed warm colors, clean and dust-free. |
| Washed #57 Gravel | No. 57: 1 in — 100%, 3/4 in — 95–100% passing, No. 4 — 0–10% | Rounded river gravel predominantly 3/4–1 in, mixed tan/brown/gray with occasional white quartz, washed clean, uniform size band (no fines, no cobbles). |
| Crushed 304s Gravel | Item 304 gradation applied to gravel: 2 in down to fines, 0–15% passing No. 200 | Dense-graded crushed gravel: angular fractured faces on tan/brown stone, full range of sizes from ~1.5 in down to sand and dust mixed together — looks "dirty"/compactable, not washed. |
| Crushed #4 Gravel | Yard callout 1.5–2.5 in (ODOT No. 4 nominal 1.5–3/4 in) | Large angular crushed gravel, fist-adjacent chunks ~1.5–2.5 in, fractured faces with some smooth rounded parent surfaces, tan/gray/brown, clean of fines. |
| Washed Oversized Gravel | Oversize/cobble fraction above the numbered sizes | Large smooth rounded river rock, roughly 3–8 in cobbles, mixed tan/gray/rust colors, washed clean. Reads as "river rock," not crushed stone. |

### Limestone (quarried, crushed)

Ohio crushed limestone is **100% angular** with sharp fractured faces and a
uniform **light gray** color (bright, slightly blue-gray when washed; dusty
white-gray film when dense-graded).

| Material | ODOT gradation | Visual requirements |
| --- | --- | --- |
| #304 Limestone | Item 304: 2 in — 100%, 1 in — 70–100%, 3/4 in — 50–90%, No. 4 — 30–60%, No. 200 — 0–15% | Dense-graded crushed limestone base: angular gray stone from ~1.5 in down to screenings and dust, all mixed; visible fine gray powder coating. The "compacts solid" look. |
| #57 Limestone | No. 57: 1 in — 100%, 3/4 in — 95–100% passing, No. 4 — 0–10% | Washed crushed limestone, uniform 3/4–1 in angular stone, bright light gray, clean faces, no fines. |

## Notes

- Crushed Concrete was removed from the catalog (per owner) — it has no
  image and no product entry.
- The live database's `imageUrl`/`imageAlt` columns are updated by
  `prisma/update-images.ts`; run it (or `npm run db:seed`) after deploying so
  Postgres points at these local images instead of the old Unsplash stock.
