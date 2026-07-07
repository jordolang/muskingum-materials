import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO, SERVICES } from "@/data/business";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";
import { VISITOR_ID_REGEX } from "@/lib/schemas";

const chatSchema = z.object({
  // Security: min(1) prevents empty message submissions that waste API quota;
  // max(5000) prevents token exhaustion attacks and DoS via excessively large prompts
  message: z.string().min(1).max(5000),
  // Security: regex restricts to alphanumeric + safe delimiters to prevent:
  // - Path traversal attacks (../, ../../)
  // - SQL injection attempts (quotes, semicolons)
  // - NoSQL injection (special MongoDB operators)
  // - Header injection (newlines, control characters)
  // max(100) prevents buffer overflow and excessive storage consumption
  visitorId: z
    .string()
    .min(1)
    .max(100)
    .regex(VISITOR_ID_REGEX, "visitorId must be alphanumeric (letters, numbers, hyphens, underscores only)")
    .optional(),
  // Security: max(50) messages prevents DoS attacks via massive history payloads
  // that would exhaust API token limits, memory, or DB storage
  history: z
    .array(
      z.object({
        // Security: enum restriction prevents prompt injection attacks where
        // malicious clients inject "system" role messages to override instructions
        // or manipulate the AI's behavior context
        role: z.enum(["user", "assistant"]),
        // Security: max(5000) per history item prevents token exhaustion when
        // combined with history array limit (50 * 5000 = 250k char max history payload)
        content: z.string().max(5000),
      })
    )
    .max(50)
    .optional()
    .default([]),
});

async function buildSystemPrompt(): Promise<string> {
  // Pull the catalog from the database so the chat answers stay in sync with
  // what customers see on the website. Prices are intentionally NOT fetched:
  // all pricing is handled by phone. If the DB is unreachable we fall through
  // with empty lists — the static keyword responder takes over below.
  let products: Array<{ name: string; description: string }> = [];

  try {
    const productRows = await prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: {
        name: true,
        shortDescription: true,
        description: true,
      },
    });
    products = productRows.map((p) => ({
      name: p.name,
      description: p.shortDescription ?? p.description,
    }));
  } catch (error) {
    logger.error("Chat catalog fetch failed", error);
  }

  const productList = products.length
    ? products.map((p) => `- ${p.name} — ${p.description}`).join("\n")
    : "(catalog temporarily unavailable — direct customers to call)";

  // Services copy comes from the static positioning constant, not the
  // database, so retired marketing language can't leak into the prompt.
  const serviceList = SERVICES.map((s) => `- ${s.title}: ${s.description}`).join(
    "\n",
  );

  return `You are a helpful, no-nonsense assistant for Muskingum Materials, a state approved sand, gravel, and aggregate supplier in Zanesville, Ohio serving contractors, municipalities, and commercial customers throughout Central and Southeastern Ohio.

BUSINESS INFORMATION:
- Name: ${BUSINESS_INFO.name}
- Address: ${BUSINESS_INFO.address}, ${BUSINESS_INFO.city}, ${BUSINESS_INFO.state} ${BUSINESS_INFO.zip}
- Phone: ${BUSINESS_INFO.phone} (Primary), ${BUSINESS_INFO.altPhone} (Alternate)
- Email: ${BUSINESS_INFO.email}
- Hours: ${BUSINESS_INFO.hours}
- Service area: ${BUSINESS_INFO.serviceArea}
- State approved materials; ODOT approved
- State-approved on-site scales
- Trucking up to 20 tons per load; semi-truck quantities available
- Delivery available (call to schedule)
- Payment: Visa, Mastercard, Discover, Apple Pay, Cash, Check

PRODUCTS (live from catalog):
${productList}

SERVICES:
${serviceList}

GUIDELINES:
- Be helpful, direct, and concise
- NEVER quote, estimate, or guess a price, price range, discount, or fee of any kind — not even ballpark figures. All pricing is quoted by phone based on the project. For any pricing, cost, or delivery-rate question, direct the customer to call ${BUSINESS_INFO.phone} for a free estimate
- For material availability, encourage calling ${BUSINESS_INFO.phone}
- If you don't know something, say so and direct them to call or email
- Keep responses brief — 2-3 sentences max unless they need detailed info
- Never make up information not provided above`;
}

/**
 * AI-powered customer service chat endpoint.
 *
 * @access public
 * @param request - Incoming request with body validated against the local `chatSchema`
 *   (message, visitorId, history). See lib/schemas.ts for shared schema conventions.
 * @returns 200 `{ reply: string }` with `X-RateLimit-*` headers on success
 * @returns 429 `{ error: string, retryAfter: number }` when rate limit is exceeded
 * @throws 400 `{ error: "Invalid request data", details: ZodError[] }` when validation fails
 * @see rateLimitedEndpoints in middleware.ts — chat tier (5 req/min per IP)
 * @see RATE_LIMIT_TIERS in lib/rate-limit.ts for tier configuration
 * @see buildSystemPrompt — dynamic prompt sourced from Prisma Product/Service tables and BUSINESS_INFO
 * @remarks Falls back to `getStaticResponse` when `ANTHROPIC_API_KEY` is absent.
 *   DB failures during conversation logging do not fail the request.
 */
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
    return `Pricing is quoted by phone based on your project. Call (740) 319-0183 for material availability and a free estimate.`;
  }

  if (lower.includes("hour") || lower.includes("open") || lower.includes("close")) {
    return `We're open Monday through Friday, 7:30 AM to 4:00 PM. We're closed on weekends. Come on by or call (740) 319-0183!`;
  }

  if (lower.includes("deliver")) {
    return `Yes, we deliver throughout Central and Southeastern Ohio — up to 20 tons per load. Call (740) 319-0183 to schedule.`;
  }

  if (lower.includes("location") || lower.includes("where") || lower.includes("address") || lower.includes("direction")) {
    return `We're located at 1133 Ellis Dam Rd, Zanesville, OH 43701. Visit our Contact page for directions, or call (740) 319-0183!`;
  }

  if (lower.includes("payment") || lower.includes("pay") || lower.includes("credit") || lower.includes("cash")) {
    return `We accept Visa, Mastercard, Discover, Apple Pay, cash, and checks. Call (740) 319-0183 with any questions.`;
  }

  return `Thanks for your question! I'd be happy to help. For the most accurate and up-to-date information, please call us at (740) 319-0183 or email sales@muskingummaterials.com. We're open Monday-Friday, 7:30 AM - 4:00 PM.`;
}
