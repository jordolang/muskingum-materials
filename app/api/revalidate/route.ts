import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const revalidateSchema = z.object({
  secret: z.string(),
  type: z.enum(["products", "services", "faq", "gallery", "testimonials"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = revalidateSchema.parse(body);

    // Verify secret token
    const revalidateSecret = process.env.REVALIDATE_SECRET || "test";
    if (data.secret !== revalidateSecret) {
      return NextResponse.json(
        { error: "Invalid secret token" },
        { status: 401 }
      );
    }

    // Revalidate the cache tag for the specified content type
    revalidateTag(data.type);

    return NextResponse.json({
      success: true,
      revalidated: true,
      type: data.type,
      now: Date.now(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.errors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
