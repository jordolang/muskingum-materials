import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCompleteRecommendations } from "@/lib/recommendations";
import { logger } from "@/lib/logger";

const querySchema = z.object({
  projectType: z.string().min(1),
  areaSize: z.string().min(1),
});

/**
 * Product and service recommendation engine endpoint.
 *
 * @access public
 * @param request - Incoming request with query params validated against the local `querySchema`
 *   (projectType, areaSize). Both parameters are required to generate recommendations.
 * @returns 200 `{ success: true, data: { products: Product[], services: Service[], estimatedCost: number, ... } }`
 *   with matched recommendations based on project type and area size
 * @returns 404 `{ success: false, error: string }` when no recommendations are found for the given project type
 * @throws 400 `{ success: false, error: "projectType and areaSize are required" }` when validation fails
 * @throws 500 `{ success: false, error: "Failed to load recommendations" }` on server/database errors
 * @see getCompleteRecommendations in lib/recommendations.ts — core recommendation algorithm
 * @remarks This endpoint is not rate-limited (not listed in middleware.ts rateLimitedEndpoints).
 *   Query params are validated via Zod; type-casting occurs after successful parse.
 *   DB failures during recommendation fetch return 500 but are logged for monitoring.
 */
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
