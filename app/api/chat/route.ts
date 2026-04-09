import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { prisma } from "@/lib/prisma";
import { BUSINESS_INFO, PRODUCTS, SERVICES } from "@/data/business";

interface ProductData {
  name: string;
  price: number;
  unit: string;
  description: string;
  stockStatus: string;
  seasonalMessage?: string | null;
}

function buildSystemPrompt(productsData: ProductData[]) {
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

PRODUCTS AND PRICING (effective 07/01/2025):
${productsData.map((p) => {
  const priceStr = p.price > 0 ? `$${p.price.toFixed(2)} per ${p.unit}` : "Call for pricing";
  let stockStr = "";

  if (p.stockStatus === "IN_STOCK") {
    stockStr = "[In Stock]";
  } else if (p.stockStatus === "LOW_STOCK") {
    stockStr = "[Low Stock - Limited Supply]";
  } else if (p.stockStatus === "OUT_OF_STOCK") {
    stockStr = "[Out of Stock]";
  } else if (p.stockStatus === "SEASONAL") {
    stockStr = p.seasonalMessage ? `[Seasonal - ${p.seasonalMessage}]` : "[Seasonal]";
  }

  return `- ${p.name}: ${priceStr} ${stockStr} — ${p.description}`;
}).join("\n")}

SERVICES:
${SERVICES.map((s) => `- ${s.title}: ${s.description}`).join("\n")}

GUIDELINES:
- Be friendly, helpful, and concise
- Always provide accurate pricing from the data above
- When customers ask about product availability, refer to the stock status indicators above
- If a product is out of stock, let them know and suggest they call (740) 319-0183 to check when it will be available
- If a product is low stock, mention limited availability and encourage them to order soon
- If a product is seasonal, explain when it's typically available
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
    const body = await request.json();
    const { message, visitorId, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch products with stock status from database
    let productsData: ProductData[] = [];
    try {
      const dbProducts = await prisma.product.findMany({
        where: { active: true },
        select: {
          name: true,
          price: true,
          unit: true,
          description: true,
          stockStatus: true,
          seasonalMessage: true,
        },
        orderBy: { sortOrder: "asc" },
      });

      productsData = dbProducts.map((p) => ({
        name: p.name,
        price: p.price || 0,
        unit: p.unit,
        description: p.description,
        stockStatus: p.stockStatus,
        seasonalMessage: p.seasonalMessage,
      }));
    } catch {
      // Fallback to static products if database is unavailable
      productsData = PRODUCTS.map((p) => ({
        name: p.name,
        price: p.price,
        unit: p.unit,
        description: p.description,
        stockStatus: "IN_STOCK",
        seasonalMessage: null,
      }));
    }

    const systemPrompt = buildSystemPrompt(productsData);

    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    let reply: string;

    if (process.env.ANTHROPIC_API_KEY) {
      const result = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        system: systemPrompt,
        messages,
        maxTokens: 500,
      });
      reply = result.text;
    } else {
      reply = getStaticResponse(message);
    }

    // Store conversation in database (best-effort)
    try {
      const conversation = await prisma.chatConversation.upsert({
        where: { id: visitorId || "anonymous" },
        update: { updatedAt: new Date() },
        create: {
          id: visitorId || `anon-${Date.now()}`,
          visitorId: visitorId || "anonymous",
        },
      });

      await prisma.chatMessage.createMany({
        data: [
          {
            conversationId: conversation.id,
            role: "user",
            content: message,
          },
          {
            conversationId: conversation.id,
            role: "assistant",
            content: reply,
          },
        ],
      });
    } catch {
      // Database not configured yet — that's okay
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        reply:
          "I'm having trouble right now. Please call us at (740) 319-0183 for immediate assistance!",
      },
      { status: 200 }
    );
  }
}

function getStaticResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("price") || lower.includes("cost") || lower.includes("how much")) {
    return `Here are some of our popular products:\n\n- Bank Run: $2.00/ton\n- Fill Dirt: $2.00/ton\n- Fill Sand: $4.00/ton\n- #57 Gravel (Washed): $15.00/ton\n- 304 Crushed Gravel: $20.00/ton\n\nPrices effective 07/01/2025. Tax of 7.25% applies. Call (740) 319-0183 for the most current pricing and volume discounts!`;
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
