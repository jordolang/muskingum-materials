import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCompleteRecommendations } from "@/lib/recommendations";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  projectType: z.string().min(1),
  areaSize: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = querySchema.safeParse({
    projectType: searchParams.get("projectType"),
    areaSize: searchParams.get("areaSize"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "projectType and areaSize are required" },
      { status: 400 }
    );
  }

  try {
    const result = await getCompleteRecommendations(
      parsed.data.projectType as Parameters<typeof getCompleteRecommendations>[0],
      parsed.data.areaSize as Parameters<typeof getCompleteRecommendations>[1]
    );

    if (!result) {
      return NextResponse.json(
        { success: false, error: "No recommendations found for this project type" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error("Failed to fetch recommendations", { error });
    return NextResponse.json(
      { success: false, error: "Failed to load recommendations" },
      { status: 500 }
    );
  }
}
