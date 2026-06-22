import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/schemas";
import { sendNotificationEmail } from "@/lib/email-service";
import { logger } from "@/lib/logger";
import { buildSatelliteMapUrl } from "@/lib/static-map";

/**
 * Submit a quote request for products and services.
 *
 * @access public
 * @param request - Incoming request with body validated against {@link quoteSchema} in lib/schemas.ts
 *   (name, email, phone, company, products, deliveryAddr, notes, projectSite). The optional `projectSite`
 *   field captures customer-drawn polygons or a geocoded location from the project estimator UI.
 * @returns 200 `{ success: true, analytics: { productCount: number, leadSource: "quote_form" } }`
 * @throws 400 `{ error: "Invalid data", details: ZodError[] }` when validation fails
 * @throws 500 `{ error: "Failed to save quote request" }` on database error
 * @throws 500 `{ error: "Internal server error" }` on unexpected error
 * @see quoteSchema in lib/schemas.ts for request body shape
 * @see rateLimitedEndpoints in middleware.ts — contact-quote tier (10 req/hr)
 * @see buildSatelliteMapUrl in lib/static-map.ts — converts project site to embedded map image URL
 * @see {@link https://postmarkapp.com} — email notification sent to sales team on success
 * @remarks When `projectSite` is provided, the handler builds a satellite map snapshot URL via
 *   {@link buildSatelliteMapUrl} that visualizes the customer-drawn area or geocoded location.
 *   This map URL, along with project estimates (area, depth, tons, cubic yards, truckloads), is
 *   persisted to the database and included in the sales team email notification to help scope the job.
 *   Project site data is entirely optional — customers can submit a simple product list without estimates.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = quoteSchema.parse(body);

    // Build a Static Maps satellite snapshot URL from the project-site data
    // the customer captured in the estimator. This URL is what the sales
    // team sees in their quote request emails and helps them understand
    // the project scope.
    const site = data.projectSite ?? null;
    const projectMapImageUrl = site?.location || (site?.polygons?.length ?? 0) > 0
      ? buildSatelliteMapUrl({
          center: site?.location ?? null,
          zoom: site?.polygons && site.polygons.length > 0 ? undefined : 19,
          polygons: site?.polygons ?? [],
        })
      : null;

    try {
      await prisma.quoteRequest.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          products: data.products,
          deliveryAddr: data.deliveryAddr || null,
          notes: data.notes || null,
          projectAddress: site?.address || null,
          projectLat: site?.location?.lat ?? null,
          projectLng: site?.location?.lng ?? null,
          projectAreaSqFt: site?.totalAreaSqFt ?? null,
          projectDepthInches: site?.depthInches ?? null,
          projectEstimateTons: site?.estimate?.tons ?? null,
          projectEstimateCubicYards: site?.estimate?.cubicYards ?? null,
          projectEstimateSource: site?.mode ?? null,
          projectPolygons: site?.polygons?.length ? site.polygons : undefined,
          projectMapImageUrl,
          projectEstimateTonsLow: site?.estimate?.tonsLow ?? null,
          projectEstimateTonsHigh: site?.estimate?.tonsHigh ?? null,
          projectEstimateCubicYardsLow: site?.estimate?.cubicYardsLow ?? null,
          projectEstimateCubicYardsHigh: site?.estimate?.cubicYardsHigh ?? null,
        },
      });
    } catch (dbError) {
      logger.error("Database error saving quote request", dbError, {
        operation: "quoteRequest.create",
        email: data.email,
        company: data.company,
      });
      return NextResponse.json({ error: "Failed to save quote request" }, { status: 500 });
    }

    // Send email notification
    const productList = data.products
      .map((p) => `  - ${p.productName}: ${p.quantity}`)
      .join("\n");

    // Build project estimate section for email
    let projectEstimateSection = "";
    if (site?.estimate) {
      const est = site.estimate;
      projectEstimateSection = `

Project Estimate:
  - Cubic Yards: ${est.cubicYards.toFixed(1)}${est.cubicYardsLow && est.cubicYardsHigh ? ` (range: ${est.cubicYardsLow.toFixed(1)} - ${est.cubicYardsHigh.toFixed(1)})` : ""}
  - Tons: ${est.tons.toFixed(1)}${est.tonsLow && est.tonsHigh ? ` (range: ${est.tonsLow.toFixed(1)} - ${est.tonsHigh.toFixed(1)})` : ""}
  - Truckloads: ${est.truckloads.toFixed(1)}${est.truckloadsLow && est.truckloadsHigh ? ` (range: ${est.truckloadsLow.toFixed(1)} - ${est.truckloadsHigh.toFixed(1)})` : ""}
  - Source: ${site.mode || "Unknown"}`;

      if (site.address) {
        projectEstimateSection += `
  - Address: ${site.address}`;
      }
      if (site.totalAreaSqFt) {
        projectEstimateSection += `
  - Area: ${site.totalAreaSqFt.toFixed(0)} sq ft`;
      }
      if (site.depthInches) {
        projectEstimateSection += `
  - Depth: ${site.depthInches}" ${est.depthVariance ? `(variance: ±${est.depthVariance}")` : ""}`;
      }
      if (projectMapImageUrl) {
        projectEstimateSection += `
  - Map: ${projectMapImageUrl}`;
      }
    }

    await sendNotificationEmail(
      `Quote Request from ${data.name}`,
      `
New quote request:

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || "Not provided"}
Company: ${data.company || "Not provided"}

Products:
${productList}

Delivery Address: ${data.deliveryAddr || "Pickup"}
Notes: ${data.notes || "None"}${projectEstimateSection}
      `.trim(),
      {
        replyTo: data.email,
        tag: "quote-request",
        metadata: {
          quoteName: data.name,
          quoteEmail: data.email,
          productCount: data.products.length.toString(),
          company: data.company || "none",
        },
      }
    );

    return NextResponse.json({
      success: true,
      analytics: {
        productCount: data.products.length,
        leadSource: "quote_form",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Quote API error", error, {
      operation: "quote.POST",
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
