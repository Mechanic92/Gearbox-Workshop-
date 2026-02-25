
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";
import * as db from "../../lib/db.js";
import * as schema from "../../lib/schema.js";
import { eq } from 'drizzle-orm';
import { TRPCError } from "@trpc/server";
import { runPartsLaborAgent } from "../../agents/parts-labor-agent.js";
import { calculateAvailability } from "../../lib/availability.js";

export const agentRouter = router({
  trigger: protectedProcedure
    .input(z.object({ jobId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      //Verify job access
      const job = await db.db.query.jobs.findFirst({
        where: eq(schema.jobs.id, input.jobId)
      });
      
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      
      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      // Trigger the agent asynchronously
      runPartsLaborAgent(input.jobId).catch(err => {
        console.error("Failed to run agent triggered via TRPC:", err);
      });

      return { success: true, message: "Agent triggered successfully" };
    }),

  processCommand: protectedProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const query = input.query.toLowerCase();
        
        // 1. Profitability Scan
        if (query.includes("profit") || query.includes("revenue") || query.includes("scan")) {
            // Calculate profitability for completed jobs in the last 30 days
            const completedJobs = await db.db.query.jobs.findMany({
                where: eq(schema.jobs.status, "COMPLETED"),
                with: {
                    invoice: {
                        with: {
                           items: true
                        } as any
                    }
                } as any
            });

            let totalRevenue = 0;
            let totalCost = 0;
            
            completedJobs.forEach((job: any) => {
                const invoiceTotal = job.invoice?.total || 0;
                totalRevenue += invoiceTotal;
                // Mock cost calculation: 40% cost, 60% margin for demo
                totalCost += (invoiceTotal * 0.4); 
            });

            const profit = totalRevenue - totalCost;
            const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) + "%" : "0%";

            return {
                type: "profitability_report",
                message: "Profitability Scan Complete",
                data: {
                    period: "All Time",
                    revenue: totalRevenue,
                    cost: totalCost,
                    profit: profit,
                    margin: margin
                }
            };
        }

        // 2. Scheduling / Booking (Mock -> Real)
        if (query.includes("book") || query.includes("schedule") || query.includes("avail")) {
             // Mock date parsing (Next Tuesday)
             // In a real agent, we'd use an NLP entity extractor or LLM to get the date
             const today = new Date();
             const nextWeek = new Date(today);
             nextWeek.setDate(today.getDate() + 7);
             
             // Check availability for "Next Week" if no date specified
             // For this demo, we just check next 3 days
             const datesToCheck = [
                new Date(today.getTime() + 86400000),
                new Date(today.getTime() + 86400000 * 2),
                new Date(today.getTime() + 86400000 * 3)
             ];

             // Mock ledger ID access (should be dynamic based on user context)
             // For now we just use the first ledger the user has access to
             const access = await db.db.query.ledgerAccess.findFirst({
                 where: eq(schema.ledgerAccess.userId, ctx.user.id)
             });
             
             if (!access) {
                 return {
                    type: "action_response",
                    message: "I can't find a workshop linked to your account.",
                    action: "navigate",
                    target: "/setup/ledger"
                };
             }

             const availabilityResults = [];
             for (const date of datesToCheck) {
                 // Use the imported calculateAvailability function
                 // We need to import it first!
                 const slots = await calculateAvailability({
                     ledgerId: access.ledgerId,
                     date: date,
                     serviceType: "General", // Default
                     serviceDuration: 60
                 }, db.db); // Pass the db instance

                 const availableSlots = slots.filter(s => s.available).map(s => s.time);
                 if (availableSlots.length > 0) {
                     availabilityResults.push({
                         date: date.toDateString(),
                         slots: availableSlots.slice(0, 3) // Top 3 slots
                     });
                 }
             }
             
             if (availabilityResults.length > 0) {
                 const message = "I found some open slots: " + availabilityResults.map(r => `${r.date} (${r.slots.join(', ')})`).join(" | ");
                   return {
                    type: "action_response",
                    message: message,
                    action: "navigate",
                    target: "/bookings"
                };
             } else {
                   return {
                    type: "action_response",
                    message: "No immediate slots found. Please check the full calendar.",
                    action: "navigate",
                    target: "/bookings"
                };
             }
        }
        
        // 3. Communication Hub
        if (query.includes("email") || query.includes("sms") || query.includes("text") || query.includes("message")) {
             // Mock sending logic
             // Real implementation would parse "Email John about invoice" -> extract "John", "invoice"
             
             return {
                type: "action_response",
                message: "I've drafted that message. Please review the 'Communication' tab before I send it.",
                action: "navigate", // Or "draft_created"
                target: "/trades/customers" 
            };
        }

         // 4. Status Check
        if (query.includes("status")) {
             return {
                type: "status_report",
                message: "System Operational. All agents are online.",
            };
        }

        return {
            type: "unknown",
            message: "I didn't understand that command. Try 'Analyze Profitability', 'Check Availability', or 'Send Email'."
        };
    }),
});
