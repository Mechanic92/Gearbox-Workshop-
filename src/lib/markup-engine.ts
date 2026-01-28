import { db } from './db';
import * as schema from './schema';
import { eq, and, lte, gte } from 'drizzle-orm';

/**
 * Gearbox Pricing & Markup Engine
 * 
 * Implements tiered markup rules:
 * - 0–10: 75–100% (Default 85%)
 * - 10–100: 45–60% (Default 50%)
 * - 100–500: 30–40% (Default 35%)
 * - 500+: 20–25% (Default 22.5%)
 */

export async function calculateSellPrice(costExGst: number, ledgerId: number, markupRuleId?: number): Promise<number> {
  // 1. If a specific markup rule is provided, use it
  if (markupRuleId) {
    const rule = await db.query.markupRules.findFirst({
        where: eq(schema.markupRules.id, markupRuleId)
    });
    if (rule) {
        return costExGst * (1 + rule.markupPercent / 100);
    }
  }

  // 2. Otherwise find the default rule for the cost bracket in this ledger
  const customRule = await db.query.markupRules.findFirst({
    where: and(
        eq(schema.markupRules.ledgerId, ledgerId),
        lte(schema.markupRules.minCost, costExGst),
        gte(schema.markupRules.maxCost, costExGst),
        eq(schema.markupRules.isActive, true)
    )
  });

  if (customRule) {
    return costExGst * (1 + customRule.markupPercent / 100);
  }

  // 3. Fallback to hardcoded SaaS defaults
  let markup = 0;
  if (costExGst <= 10) markup = 85;
  else if (costExGst <= 100) markup = 50;
  else if (costExGst <= 500) markup = 35;
  else markup = 22.5;

  return costExGst * (1 + markup / 100);
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(price);
}
