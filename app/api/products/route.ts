import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Public product catalog endpoint.
 *
 * @access public
 * @returns 200 `{ products: Array<{
 *   id: string,
 *   slug: string,
 *   name: string,
 *   category: string,
 *   shortDescription: string,
 *   price: number,
 *   unit: string,
 *   imageUrl: string | null,
 *   imageAlt: string | null
 * }> }` with all active products sorted by sortOrder ascending
 * @see prisma.product.findMany — source of truth for active products
 * @see dynamic = "force-dynamic" — disables Next.js caching to reflect price edits immediately
 * @remarks Read-only endpoint used by client components (recurring orders form, future widgets)
 *   that can't run Prisma directly. Degrades gracefully to `{ products: [] }` when
 *   `DATABASE_URL` is unavailable or when database queries fail. All errors return 200
 *   with empty array rather than throwing — this prevents client-side errors when the
 *   database is temporarily unreachable.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        shortDescription: true,
        price: true,
        unit: true,
        imageUrl: true,
        imageAlt: true,
      },
    });
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
