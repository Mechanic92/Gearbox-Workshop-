/**
 * ============================================================================
 * INTELLIGENCE API ROUTER
 * ============================================================================
 * 
 * Exposes anonymized industry benchmarks via tRPC.
 * Two access levels:
 *   1. Platform users → See how their shop compares to industry
 *   2. API consumers (future) → Purchase aggregate data feeds
 * 
 * This router NEVER exposes raw signal data.
 * Only pre-computed, statistically anonymized benchmarks.
 */

import { z } from "zod";
import { protectedProcedure, router } from "../../server/trpc.js";
import { 
  computeAllBenchmarks, 
  getBenchmark, 
  getBenchmarksByType, 
  getIntelligenceSummary 
} from "./benchmarks.js";
import { anonymizeShopId, getCurrentQuarter } from "./collector.js";
import { db as database } from "../db.js";
import * as schema from "../schema.js";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const intelligenceRouter = router({

  // ═══════════════════════════════════════════════════════════════════════════
  // BENCHMARKS — What does the industry look like?
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get service pricing benchmarks.
   * "What does an oil change cost across the platform?"
   */
  getServiceBenchmarks: protectedProcedure
    .input(z.object({ 
      quarter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getBenchmarksByType('service_pricing', input.quarter);
    }),

  /**
   * Get margin benchmarks by service type.
   * "What's the typical margin on brake work?"
   */
  getMarginBenchmarks: protectedProcedure
    .input(z.object({ 
      quarter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getBenchmarksByType('service_margin', input.quarter);
    }),

  /**
   * Get vehicle repair cost benchmarks.
   * "How much does it cost to fix a Toyota Hilux on average?"
   */
  getVehicleBenchmarks: protectedProcedure
    .input(z.object({ 
      quarter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getBenchmarksByType('vehicle_repair_cost', input.quarter);
    }),

  /**
   * Get parts markup benchmarks.
   * "What's the industry standard markup on filters?"
   */
  getPartsMarkupBenchmarks: protectedProcedure
    .input(z.object({ 
      quarter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getBenchmarksByType('parts_markup', input.quarter);
    }),

  /**
   * Get shop performance benchmarks.
   * "What does a top-performing workshop look like?"
   */
  getShopPerformanceBenchmarks: protectedProcedure
    .input(z.object({ 
      quarter: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getBenchmarksByType('shop_performance', input.quarter);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // MY SHOP vs INDUSTRY — Comparative analytics
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Compare a shop's metrics against industry benchmarks.
   * "How does MY shop compare to the industry average?"
   * 
   * Returns the shop's position relative to percentiles.
   */
  getMyShopComparison: protectedProcedure
    .input(z.object({
      ledgerId: z.number(),
      quarter: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await database.query.ledgerAccess.findFirst({
        where: and(
          eq(schema.ledgerAccess.ledgerId, input.ledgerId),
          eq(schema.ledgerAccess.userId, ctx.user.id),
        ),
      });
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const q = input.quarter || getCurrentQuarter();
      const anonId = anonymizeShopId(input.ledgerId);

      // Get this shop's latest health snapshot
      const shopHealth = await database.query.intelligenceShopHealth.findFirst({
        where: and(
          eq(schema.intelligenceShopHealth.anonShopId, anonId),
          eq(schema.intelligenceShopHealth.quarter, q),
        ),
        orderBy: desc(schema.intelligenceShopHealth.createdAt),
      });

      // Get industry benchmarks
      const performanceBenchmarks = await getBenchmarksByType('shop_performance', q);

      if (!shopHealth || performanceBenchmarks.length === 0) {
        return {
          hasData: false,
          message: 'Insufficient data for comparison. Keep using the platform — benchmarks will appear once enough data is collected.',
        };
      }

      // Build comparison
      const comparisons: Array<{
        metric: string;
        myValue: number;
        industryMedian: number;
        industryP75: number;
        percentilePosition: string; // "above_average", "top_quartile", "below_average"
      }> = [];

      const metricMap: Record<string, number> = {
        avgJobValue: shopHealth.avgJobValue,
        avgCycleTimeDays: shopHealth.avgCycleTimeDays,
        quoteConversionRate: shopHealth.quoteConversionRate,
        utilizationRate: shopHealth.utilizationRate,
        revenuePerBay: shopHealth.revenuePerBay,
      };

      for (const benchmark of performanceBenchmarks) {
        const myValue = metricMap[benchmark.dimension];
        if (myValue == null) continue;

        let position = 'average';
        // For cycle time, lower is better
        if (benchmark.dimension === 'avgCycleTimeDays') {
          if (myValue <= benchmark.p25) position = 'top_quartile';
          else if (myValue <= benchmark.median) position = 'above_average';
          else if (myValue <= benchmark.p75) position = 'below_average';
          else position = 'bottom_quartile';
        } else {
          // For all other metrics, higher is better
          if (myValue >= benchmark.p75) position = 'top_quartile';
          else if (myValue >= benchmark.median) position = 'above_average';
          else if (myValue >= benchmark.p25) position = 'below_average';
          else position = 'bottom_quartile';
        }

        comparisons.push({
          metric: benchmark.dimension,
          myValue,
          industryMedian: benchmark.median,
          industryP75: benchmark.p75,
          percentilePosition: position,
        });
      }

      return {
        hasData: true,
        quarter: q,
        comparisons,
      };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // INTELLIGENCE SUMMARY — Platform-wide data health
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get overall intelligence data summary.
   * Used in admin dashboard and investor pitch decks.
   */
  getSummary: protectedProcedure
    .query(async () => {
      return getIntelligenceSummary();
    }),

  /**
   * Manually trigger benchmark computation (admin only).
   */
  computeBenchmarks: protectedProcedure
    .input(z.object({ 
      quarter: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return computeAllBenchmarks(input.quarter);
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PRICING INTELLIGENCE — AI-powered price recommendations
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Get recommended pricing for a service.
   * "What should I charge for an oil change on a 2022 Hilux?"
   */
  getRecommendedPricing: protectedProcedure
    .input(z.object({
      serviceDescription: z.string(),
      vehicleMake: z.string().optional(),
      vehicleModel: z.string().optional(),
      vehicleYear: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const q = getCurrentQuarter();
      
      // Classify the service
      const { categorizeService } = await import('./collector.js');
      const category = categorizeService(input.serviceDescription);

      // Get pricing benchmark for this service category
      const pricingBenchmark = await getBenchmark('service_pricing', category, q);
      const marginBenchmark = await getBenchmark('service_margin', category, q);

      // Try to get vehicle-specific data
      let vehicleBenchmark = null;
      if (input.vehicleMake && input.vehicleModel) {
        vehicleBenchmark = await getBenchmark(
          'vehicle_repair_cost', 
          `${input.vehicleMake}:${input.vehicleModel}`, 
          q
        );
      }

      if (!pricingBenchmark) {
        return {
          hasRecommendation: false,
          message: 'Not enough industry data yet for this service type.',
          serviceCategory: category,
        };
      }

      return {
        hasRecommendation: true,
        serviceCategory: category,
        recommendedRange: {
          low: pricingBenchmark.p25,
          mid: pricingBenchmark.median,
          high: pricingBenchmark.p75,
        },
        industryAverage: pricingBenchmark.mean,
        typicalMargin: marginBenchmark ? {
          low: marginBenchmark.p25,
          mid: marginBenchmark.median,
          high: marginBenchmark.p75,
        } : null,
        vehicleSpecific: vehicleBenchmark ? {
          low: vehicleBenchmark.p25,
          mid: vehicleBenchmark.median,
          high: vehicleBenchmark.p75,
          sampleSize: vehicleBenchmark.sampleSize,
        } : null,
        dataQuality: {
          sampleSize: pricingBenchmark.sampleSize,
          quarter: q,
          confidence: pricingBenchmark.sampleSize >= 30 ? 'high' : 
                      pricingBenchmark.sampleSize >= 10 ? 'medium' : 'low',
        },
      };
    }),
});
