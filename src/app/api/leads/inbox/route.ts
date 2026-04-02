import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// Enriches inbox threads with real lead data from the database
export async function GET() {
  try {
    const leads = await prisma.lead.findMany({ take: 20, orderBy: { createdAt: "desc" } });

    // Build threads from leads that have been contacted
    const threads = leads
      .filter((l) => l.status !== "New")
      .slice(0, 8)
      .map((lead, idx) => {
        const isHot = lead.score >= 80;
        const isWarm = lead.score >= 60;
        return {
          id: `thread-${lead.id}`,
          senderName: lead.contactName,
          senderEmail: lead.email,
          senderCompany: lead.companyName,
          subject: getSubject(lead.companyName, idx),
          preview: getPreview(idx),
          time: lead.lastContactedAt || lead.createdAt,
          unread: idx < 3,
          starred: isHot,
          leadId: lead.id,
          messages: generateMessages(lead, idx),
          leadContext: {
            name: lead.contactName,
            company: lead.companyName,
            email: lead.email,
            phone: lead.phone || "",
            website: lead.website || "",
            score: lead.score,
            status: isHot ? "Hot" : isWarm ? "Warm" : "Cold",
            stage: lead.status,
            industry: lead.industry || "Unknown",
            location: lead.location || "Unknown",
            employees: lead.employeeCount || 0,
            tags: JSON.parse(lead.tags || "[]"),
            lastContacted: lead.lastContactedAt || "",
          },
        };
      });

    return NextResponse.json(threads);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inbox" }, { status: 500 });
  }
}

function getSubject(company: string, idx: number): string {
  const subjects = [
    `Re: Bulk pricing for Q2 orders`,
    `Interested in eco-friendly materials`,
    `Re: Partnership opportunity`,
    `Custom packaging quote request`,
    `Re: Import logistics question`,
    `Trial order update`,
    `Re: Contract proposal review`,
    `Urgently looking for bulk supplier`,
  ];
  return subjects[idx % subjects.length];
}

function getPreview(idx: number): string {
  const previews = [
    "Thanks for sending over the price list. I've reviewed it with our procurement team and we'd like to discuss...",
    "I saw your new product line announcement and wanted to learn more about the eco-friendly building materials...",
    "Absolutely, we're very interested in exploring a wholesale partnership. Our current supplier hasn't been...",
    "We need a quote for 50,000 custom corrugated boxes with our branding. Dimensions would be...",
    "Great question about the customs documentation. For the products you mentioned, you'll need...",
    "Just wanted to confirm our trial order shipped yesterday. We're excited to test the new...",
    "Our legal team has reviewed the contract and we have a few minor changes. Overall we're aligned on...",
    "We need a reliable bulk supplier ASAP. Our current vendor just notified us they're discontinuing...",
  ];
  return previews[idx % previews.length];
}

function generateMessages(lead: { contactName: string; email: string; companyName: string }, idx: number) {
  const bodies = [
    { outgoing: `Hi ${lead.contactName.split(" ")[0]},\n\nFollowing up on our call yesterday. I've put together a custom pricing sheet for ${lead.companyName} based on the volumes we discussed.\n\nPlease find the attached price list for Q2. We can offer an additional 5% discount on orders over $50K.\n\nLooking forward to hearing your thoughts.\n\nBest,\nSarah`, incoming: `Thanks for sending over the price list. I've reviewed it with our procurement team and we'd like to discuss the olive oil and frozen seafood categories in more detail.\n\nCould we schedule a call this Thursday to go over the specifics? Our team is particularly interested in the tier pricing structure.\n\nBest,\n${lead.contactName}` },
    { outgoing: null, incoming: `Hi there,\n\nI saw your new product line announcement and wanted to learn more about the eco-friendly building materials you've launched. ${lead.companyName} is actively looking for sustainable alternatives.\n\nCould you send me a catalog and pricing details?\n\nThanks,\n${lead.contactName}` },
    { outgoing: `Hi ${lead.contactName.split(" ")[0]},\n\nI noticed ${lead.companyName} has been expanding rapidly. We specialize in bulk organic produce at competitive wholesale prices.\n\nWould you be open to a quick call to explore a potential partnership?\n\nBest,\nSarah`, incoming: `Absolutely, we're very interested in exploring a wholesale partnership. Our current supplier hasn't been meeting our volume needs and we're actively looking for alternatives.\n\nI'm free Thursday 2-4pm ET. Does that work?\n\nBest,\n${lead.contactName}` },
    { outgoing: null, incoming: `Hi,\n\nWe need a quote for 50,000 custom corrugated boxes with our branding. Dimensions would be 12x12x8.\n\nPlease advise on lead times and pricing tiers.\n\nThanks,\n${lead.contactName}` },
  ];

  const template = bodies[idx % bodies.length];
  const messages = [];
  const baseTime = new Date("2026-03-27T10:00:00Z");

  if (template.outgoing) {
    messages.push({
      id: `m-${idx}-out`,
      from: "You",
      fromEmail: "sales@wholesaleos.com",
      to: lead.contactName,
      body: template.outgoing,
      time: new Date(baseTime.getTime() - 86400000).toISOString(),
      isOutgoing: true,
    });
  }

  messages.push({
    id: `m-${idx}-in`,
    from: lead.contactName,
    fromEmail: lead.email,
    to: "You",
    body: template.incoming,
    time: baseTime.toISOString(),
    isOutgoing: false,
  });

  return messages;
}
