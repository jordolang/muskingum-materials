import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO } from "@/data/business";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const chatSchema = z.object({
  message: z.string().min(1).max(5000),
  visitorId: z.string().min(1).max(100).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(5000),
      })
    )
    .max(50)
    .optional()
    .default([]),
});

async function buildSystemPrompt(): Promise<string> {
  // Pull catalog from the database so the chat answers stay in sync with what
  // customers see on the website. If the DB is unreachable we fall through
  // with empty lists — the static keyword responder takes over below.
  let products: Array<{ name: string; price: number | null; unit: string; description: string }> = [];
  let services: Array<{ title: string; description: string }> = [];

  try {
    const [productRows, serviceRows] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: {
          name: true,
          price: true,
          unit: true,
          shortDescription: true,
          description: true,
        },
      }),
      prisma.service.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        select: { title: true, description: true },
      }),
    ]);
    products = productRows.map((p) => ({
      name: p.name,
      price: p.price,
      unit: p.unit,
      description: p.shortDescription ?? p.description,
    }));
    services = serviceRows;
  } catch (error) {
    logger.error("Chat catalog fetch failed", error);
  }

  const productList = products.length
    ? products
        .map(
          (p) =>
            `- ${p.name}: ${p.price && p.price > 0 ? `$${p.price.toFixed(2)} per ${p.unit}` : "Call for pricing"} — ${p.description}`
        )
        .join("\n")
    : "(catalog temporarily unavailable — direct customers to call for pricing)";

  const serviceList = services.length
    ? services.map((s) => `- ${s.title}: ${s.description}`).join("\n")
    : "(services temporarily unavailable)";

  return `You are a friendly, knowledgeable customer service assistant for Muskingum Materials, a family-owned sand, soil, and gravel company in Zanesville, Ohio.

BUSINESS INFORMATION:
- Name: ${BUSINESS_INFO.name}
- Address: ${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}
- Phone: ${BUSINESS_INFO.phone} (Primary), ${BUSINESS_INFO.altPhone} (Alternate)
- Email: ${BUSINESS_INFO.email}
- Hours: ${BUSINESS_INFO.hours}
- Tagline: ${BUSINESS_INFO.tagline}
- Family-owned company with fair pricing
- State-approved on-site scales
- State of the art equipment
- Trucking up to 20 tons per load
- Delivery available (call for rates)
- Payment: Visa, Mastercard, Discover, Apple Pay, Cash, Check
- Tax: 7.25% | Credit card processing fee: 4.5% per ticket

PRODUCTS AND PRICING (live from catalog):
${productList}

SERVICES:
${serviceList}

GUIDELINES:
- Be friendly, helpful, and concise
- Always provide accurate pricing from the data above
- If asked about pricing for items marked "Call for pricing," direct them to call (740) 319-0183
- For delivery rates, tell them to call for current delivery pricing
- Remind customers that prices are subject to change and to call for the most recent pricing
- Encourage customers to call (740) 319-0183 to place orders
- If you don't know something, say so and direct them to call or email
- Keep responses brief and helpful — 2-3 sentences max unless they need detailed info
- Never make up information not provided above`;
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(identifier, "chat");

    logger.info("Chat request rate limit check", {
      identifier,
      success: rateLimitResult.success,
      remaining: rateLimitResult.remaining,
      limit: rateLimitResult.limit,
    });

    if (!rateLimitResult.success) {
      logger.warn("Chat rate limit exceeded", {
        identifier,
        limit: rateLimitResult.limit,
        reset: rateLimitResult.reset,
      });

      const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    // Warn if approaching rate limit
    if (rateLimitResult.remaining <= 1) {
      logger.warn("Chat rate limit approaching", {
        identifier,
        remaining: rateLimitResult.remaining,
        limit: rateLimitResult.limit,
      });
    }

    const body = await request.json();
    const data = chatSchema.parse(body);

    const messages = [
      ...data.history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: data.message },
    ];

    let reply: string;

    if (process.env.ANTHROPIC_API_KEY) {
      const systemPrompt = await buildSystemPrompt();
      const result = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        system: systemPrompt,
        messages,
        maxOutputTokens: 500,
      });
      reply = result.text;
    } else {
      reply = await getStaticResponse(data.message);
    }

    // Store conversation in database (best-effort)
    const visitorId = data.visitorId || `anon-${crypto.randomUUID()}`;
    try {
      const conversation = await prisma.chatConversation.upsert({
        where: { visitorId },
        update: { updatedAt: new Date() },
        create: {
          visitorId,
        },
      });

      await prisma.chatMessage.createMany({
        data: [
          {
            conversationId: conversation.id,
            role: "user",
            content: data.message,
          },
          {
            conversationId: conversation.id,
            role: "assistant",
            content: reply,
          },
        ],
      });
    } catch (error) {
      logger.error("Chat DB save error", error, { visitorId });
    }

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn("Chat request validation failed", {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Chat request processing error", error);
    return NextResponse.json(
      {
        reply:
          "I'm having trouble right now. Please call us at (740) 319-0183 for immediate assistance!",
      },
      { status: 200 }
    );
  }
}

async function getStaticResponse(message: string): Promise<string> {
  const lower = message.toLowerCase();

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    let pricingLines = "Call (740) 319-0183 for current product pricing.";
    try {
      const featured = await prisma.product.findMany({
        where: { active: true, price: { gt: 0 } },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: 5,
        select: { name: true, price: true, unit: true },
      });
      if (featured.length > 0) {
        pricingLines = featured
          .map((p) => `- ${p.name}: $${(p.price ?? 0).toFixed(2)}/${p.unit}`)
          .join("\n");
      }
    } catch (error) {
      logger.error("Static chat pricing fetch failed", error);
    }
    return `Here are some of our popular products:\n\n${pricingLines}\n\nTax of 7.25% applies. Call (740) 319-0183 for the most current pricing and volume discounts!`;
  }

  if (lower.includes("hour") || lower.includes("open") || lower.includes("close")) {
    return `We're open Monday through Friday, 7:30 AM to 4:00 PM. We're closed on weekends. Come on by or call (740) 319-0183!`;
  }

  if (lower.includes("deliver")) {
    return `Yes, we offer delivery! We can truck up to 20 tons per load to your job site. Call (740) 319-0183 for current delivery rates and to schedule.`;
  }

  if (lower.includes("location") || lower.includes("where") || lower.includes("address") || lower.includes("direction")) {
    return `We're located at 1133 Ellis Dam Rd, Zanesville, OH 43701. Visit our Contact page for directions, or call (740) 319-0183!`;
  }

  if (lower.includes("payment") || lower.includes("pay") || lower.includes("credit") || lower.includes("cash")) {
    return `We accept Visa, Mastercard, Discover, Apple Pay, cash, and checks. Note: a 4.5% credit card processing fee applies per ticket. Tax is 7.25%.`;
  }

  return `Thanks for your question! I'd be happy to help. For the most accurate and up-to-date information, please call us at (740) 319-0183 or email sales@muskingummaterials.com. We're open Monday-Friday, 7:30 AM - 4:00 PM.`;
}
