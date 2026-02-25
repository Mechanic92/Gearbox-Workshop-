import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "../../lib/db";
import { standardPriceList } from "../../lib/schema";
import { eq, like, or } from "drizzle-orm";

export const standardPriceTool = new DynamicStructuredTool({
  name: "standard_price_lookup",
  description: "Looks up standard labor times and rates for common automotive services. Use this to estimate labor costs.",
  schema: z.object({
    query: z.string().describe("The name of the service or keyword to search for, e.g., 'Oil Change', 'Brake Pads'"),
    ledgerId: z.number().describe("The ID of the ledger (shop) to search within"),
  }),
  func: async ({ query, ledgerId }) => {
    try {
      const results = await db.query.standardPriceList.findMany({
        where: or(
          like(standardPriceList.serviceName, `%${query}%`),
          like(standardPriceList.description, `%${query}%`)
        ),
      });
      
      // Filter by ledgerId in memory if needed, or add to query above. 
      // Note: The schema has ledgerId, so we should strictly filter by it
      const filtered = results.filter(r => r.ledgerId === ledgerId);

      if (filtered.length === 0) {
        return JSON.stringify({ found: false, message: "No standard price found for this service. Manual labor estimation required." });
      }

      return JSON.stringify({ found: true, matches: filtered });
    } catch (error) {
      return JSON.stringify({ found: false, error: "Database error" });
    }
  },
});
