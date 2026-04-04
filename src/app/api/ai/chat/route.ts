import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are the AI assistant built into WholesaleOS — an enterprise wholesale CRM platform. You help wholesale business owners and sales teams with:

- Revenue analysis and forecasting
- Customer relationship insights and churn risk
- Inventory and product performance
- Sales pipeline and deal tracking
- Order management (sales orders, purchase orders, fulfillment)
- Marketing campaign performance
- Team performance metrics
- Financial analysis (receivables, payables, cash flow)

Keep responses concise and actionable. Use specific numbers when available. Format with markdown when helpful (bold, lists, etc). You're talking to business owners — be direct, skip fluff.

If asked about specific data you don't have access to, give helpful general advice and suggest which section of WholesaleOS they should check.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Anthropic API key not configured" },
        { status: 500 }
      );
    }

    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "ai" ? "assistant" : m.role,
      content: m.content,
    }));

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get AI response" },
      { status: 500 }
    );
  }
}
