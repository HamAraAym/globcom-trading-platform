"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export interface TradeMatch {
  demandId: string;
  supplyId: string;
  demandTitle: string;
  supplyTitle: string;
  demandQuantity: number;
  supplyQuantity: number;
  demandPrice: number | null;
  supplyPrice: number | null;
  confidenceScore: number;
  matchReasons: string[];
}

export async function runMatchingEngine(): Promise<TradeMatch[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized");

  // 1. Fetch only ACTIVE deals
  const demands = await prisma.demand.findMany({
    where: { status: "ACTIVE" },
    include: { createdBy: true }
  });

  const supplies = await prisma.supply.findMany({
    where: { status: "ACTIVE" },
    include: { createdBy: true }
  });

  const matches: TradeMatch[] = [];

  // 2. The Heuristic Matching Engine
  for (const demand of demands) {
    for (const supply of supplies) {
      let score = 0;
      const reasons: string[] = [];

      // --- VECTOR 1: COMMODITY MATCH (Title / Keywords) - Weight: 50% ---
      const demandWords = demand.title.toLowerCase().split(/\s+/);
      const supplyWords = supply.title.toLowerCase().split(/\s+/);
      
      // Find intersecting keywords (ignoring generic words)
      const ignoreWords = ["in", "bulk", "for", "sale", "purchase", "wanted"];
      const intersection = demandWords.filter(w => supplyWords.includes(w) && !ignoreWords.includes(w));

      if (intersection.length > 0) {
        score += 50;
        reasons.push(`Commodity match on keywords: "${intersection.join(", ")}"`);
      }

      // --- VECTOR 2: VOLUME MATCH (Quantity) - Weight: 25% ---
      // If the supply can fulfill at least 50% of the demand, or isn't wildly oversized
      const qtyRatio = supply.quantity / demand.quantity;
      if (qtyRatio >= 0.5 && qtyRatio <= 2.0) {
        score += 25;
        reasons.push("Volume alignment (Within acceptable tolerance)");
      } else if (qtyRatio > 0.1 && qtyRatio < 0.5) {
        score += 10;
        reasons.push("Partial volume fulfillment possible");
      }

      // --- VECTOR 3: PRICE MATCH - Weight: 25% ---
      const dPrice = demand.targetPrice || 0;
      const sPrice = supply.price || 0;

      if (dPrice > 0 && sPrice > 0) {
        if (sPrice <= dPrice) {
          // Supply is cheaper than or equal to Demand Target! Highly profitable.
          score += 25;
          reasons.push("Highly profitable margin potential");
        } else if (sPrice <= dPrice * 1.1) {
          // Supply is within 10% of Target Price
          score += 15;
          reasons.push("Price within 10% negotiable range");
        }
      } else {
        // If one is TBD, we give a neutral bump to encourage negotiation
        score += 10;
        reasons.push("Price requires manual negotiation (TBD)");
      }

      // 3. Register the match if confidence is above the threshold (e.g., 60%)
      if (score >= 60) {
        matches.push({
          demandId: demand.id,
          supplyId: supply.id,
          demandTitle: demand.title,
          supplyTitle: supply.title,
          demandQuantity: demand.quantity,
          supplyQuantity: supply.quantity,
          demandPrice: demand.targetPrice,
          supplyPrice: supply.price,
          confidenceScore: score,
          matchReasons: reasons
        });
      }
    }
  }

  // Sort by highest confidence score first
  return matches.sort((a, b) => b.confidenceScore - a.confidenceScore);
}