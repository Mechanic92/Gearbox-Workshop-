import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "../../lib/db";
import { parts } from "../../lib/schema";
import { eq, like, or } from "drizzle-orm";

export const partsLookupTool = new DynamicStructuredTool({
  name: "parts_lookup",
  description: "Looks up parts in the local inventory. Use this to find part numbers, prices, and stock levels.",
  schema: z.object({
    query: z.string().describe("The search term: part name, part number, or keyword (e.g., 'Oil Filter', '123-456')"),
    ledgerId: z.number().describe("The ID of the ledger (shop) to search within"),
    vehicleInfo: z.string().optional().describe("Vehicle make/model/year if available, for context"),
  }),
  func: async ({ query, ledgerId, vehicleInfo }) => {
    try {
      const results = await db.query.parts.findMany({
        where: or(
            like(parts.name, `%${query}%`),
            like(parts.partNumber, `%${query}%`),
            like(parts.description, `%${query}%`)
        ),
        limit: 5,
      });

      const filtered = results.filter(r => r.ledgerId === ledgerId);

      if (filtered.length === 0) {
        // In a real agent, this might trigger a call to an external vendor API.
        // For now, we return a structured response indicating it's not in stock.
        return JSON.stringify({ 
            found: false, 
            message: "Part not found in local inventory.", 
            suggestion: "Mark as 'Requires External Sourcing'" 
        });
      }

      return JSON.stringify({ found: true, matches: filtered });
    } catch (error) {
      return JSON.stringify({ found: false, error: "Database error during parts lookup" });
    }
  },
});
