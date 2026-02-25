/**
 * ============================================================================
 * BENCHMARK AGGREGATION ENGINE
 * ============================================================================
 * 
 * Computes statistical benchmarks from raw anonymous signals.
 * Runs periodically to produce the pre-computed data products
 * that power APIs, reports, and AI recommendations.
 * 
 * Output examples:
 * → "Median oil change cost in NZ: $89 (p25: $65, p75: $125)"
 * → "Toyota Hilux brake pad replacement: $340-$520 range"
 * → "Average workshop margin on brakes: 42%"
 * → "Peak booking demand: Tuesday 9-11am"
 */

import { db as database } from '../db.js';
import * as schema from '../schema.js';
import { eq, sql, and, desc } from 'drizzle-orm';
import { getCurrentQuarter } from './collector.js';

// ============================================================================
// STATISTICAL HELPERS
// ============================================================================

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (idx - lower) * (sorted[upper] - sorted[lower]);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const sqDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(sqDiffs.reduce((s, v) => s + v, 0) / (values.length - 1));
}

// ============================================================================
// BENCHMARK COMPUTATIONS
// ============================================================================

/**
 * Minimum sample size before we publish a benchmark.
 * Prevents statistical noise and helps with anonymity
 * (can't reverse-engineer small groups).
 */
const MIN_SAMPLE_SIZE = 5;

/**
 * Compute service pricing benchmarks.
 * Groups by service category and produces percentile distributions.
 */
async function computeServicePricingBenchmarks(quarter: string) {
  try {
    const signals = await database.query.intelligenceJobSignals.findMany({
      where: eq(schema.intelligenceJobSignals.quarter, quarter),
    });

    // Group by service category
    const groups = new Map<string, number[]>();
    for (const s of signals) {
      if (!groups.has(s.serviceCategory)) groups.set(s.serviceCategory, []);
      groups.get(s.serviceCategory)!.push(s.totalJobValue);
    }

    const benchmarks: any[] = [];
    for (const [category, values] of groups) {
      if (values.length < MIN_SAMPLE_SIZE) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      benchmarks.push({
        benchmarkType: 'service_pricing',
        dimension: category,
        region: 'nz',
        sampleSize: values.length,
        p25: Math.round(percentile(sorted, 25) * 100) / 100,
        median: Math.round(percentile(sorted, 50) * 100) / 100,
        p75: Math.round(percentile(sorted, 75) * 100) / 100,
        mean: Math.round(mean(values) * 100) / 100,
        stddev: Math.round(stddev(values) * 100) / 100,
        quarter,
      });
    }

    return benchmarks;
  } catch (err) {
    console.error('[Benchmarks] Service pricing computation failed:', (err as Error).message);
    return [];
  }
}

/**
 * Compute margin benchmarks by service type.
 */
async function computeMarginBenchmarks(quarter: string) {
  try {
    const signals = await database.query.intelligenceJobSignals.findMany({
      where: eq(schema.intelligenceJobSignals.quarter, quarter),
    });

    const groups = new Map<string, number[]>();
    for (const s of signals) {
      if (!groups.has(s.serviceCategory)) groups.set(s.serviceCategory, []);
      groups.get(s.serviceCategory)!.push(s.marginPercent);
    }

    const benchmarks: any[] = [];
    for (const [category, values] of groups) {
      if (values.length < MIN_SAMPLE_SIZE) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      benchmarks.push({
        benchmarkType: 'service_margin',
        dimension: category,
        region: 'nz',
        sampleSize: values.length,
        p25: Math.round(percentile(sorted, 25) * 10) / 10,
        median: Math.round(percentile(sorted, 50) * 10) / 10,
        p75: Math.round(percentile(sorted, 75) * 10) / 10,
        mean: Math.round(mean(values) * 10) / 10,
        stddev: Math.round(stddev(values) * 10) / 10,
        quarter,
      });
    }

    return benchmarks;
  } catch (err) {
    console.error('[Benchmarks] Margin computation failed:', (err as Error).message);
    return [];
  }
}

/**
 * Compute vehicle repair frequency and cost benchmarks.
 * Groups by make + model.
 */
async function computeVehicleIntelligence(quarter: string) {
  try {
    const signals = await database.query.intelligenceJobSignals.findMany({
      where: eq(schema.intelligenceJobSignals.quarter, quarter),
    });

    // Group by make:model
    const groups = new Map<string, number[]>();
    for (const s of signals) {
      if (s.vehicleMake === 'unknown') continue;
      const key = `${s.vehicleMake}:${s.vehicleModel}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s.totalJobValue);
    }

    const benchmarks: any[] = [];
    for (const [dimension, values] of groups) {
      if (values.length < MIN_SAMPLE_SIZE) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      benchmarks.push({
        benchmarkType: 'vehicle_repair_cost',
        dimension,
        region: 'nz',
        sampleSize: values.length,
        p25: Math.round(percentile(sorted, 25) * 100) / 100,
        median: Math.round(percentile(sorted, 50) * 100) / 100,
        p75: Math.round(percentile(sorted, 75) * 100) / 100,
        mean: Math.round(mean(values) * 100) / 100,
        stddev: Math.round(stddev(values) * 100) / 100,
        quarter,
      });
    }

    // Also compute repair frequency by make (how many times a make appears)
    const makeGroups = new Map<string, number>();
    for (const s of signals) {
      if (s.vehicleMake === 'unknown') continue;
      makeGroups.set(s.vehicleMake, (makeGroups.get(s.vehicleMake) || 0) + 1);
    }

    return benchmarks;
  } catch (err) {
    console.error('[Benchmarks] Vehicle intelligence computation failed:', (err as Error).message);
    return [];
  }
}

/**
 * Compute parts markup benchmarks.
 */
async function computePartsMarkupBenchmarks(quarter: string) {
  try {
    const signals = await database.query.intelligencePartSignals.findMany({
      where: eq(schema.intelligencePartSignals.quarter, quarter),
    });

    const groups = new Map<string, number[]>();
    for (const s of signals) {
      if (!groups.has(s.partCategory)) groups.set(s.partCategory, []);
      groups.get(s.partCategory)!.push(s.markupPercent);
    }

    const benchmarks: any[] = [];
    for (const [category, values] of groups) {
      if (values.length < MIN_SAMPLE_SIZE) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      benchmarks.push({
        benchmarkType: 'parts_markup',
        dimension: category,
        region: 'nz',
        sampleSize: values.length,
        p25: Math.round(percentile(sorted, 25) * 10) / 10,
        median: Math.round(percentile(sorted, 50) * 10) / 10,
        p75: Math.round(percentile(sorted, 75) * 10) / 10,
        mean: Math.round(mean(values) * 10) / 10,
        stddev: Math.round(stddev(values) * 10) / 10,
        quarter,
      });
    }

    return benchmarks;
  } catch (err) {
    console.error('[Benchmarks] Parts markup computation failed:', (err as Error).message);
    return [];
  }
}

/**
 * Compute shop health benchmarks (what does a "good" shop look like?).
 */
async function computeShopHealthBenchmarks(quarter: string) {
  try {
    const signals = await database.query.intelligenceShopHealth.findMany({
      where: eq(schema.intelligenceShopHealth.quarter, quarter),
    });

    if (signals.length < MIN_SAMPLE_SIZE) return [];

    const metrics = [
      { key: 'avgJobValue', field: 'avgJobValue' as const },
      { key: 'avgCycleTimeDays', field: 'avgCycleTimeDays' as const },
      { key: 'quoteConversionRate', field: 'quoteConversionRate' as const },
      { key: 'utilizationRate', field: 'utilizationRate' as const },
      { key: 'revenuePerBay', field: 'revenuePerBay' as const },
    ];

    const benchmarks: any[] = [];
    for (const metric of metrics) {
      const values = signals.map(s => s[metric.field]).filter(v => v != null && v > 0);
      if (values.length < MIN_SAMPLE_SIZE) continue;

      const sorted = [...values].sort((a, b) => a - b);
      benchmarks.push({
        benchmarkType: 'shop_performance',
        dimension: metric.key,
        region: 'nz',
        sampleSize: values.length,
        p25: Math.round(percentile(sorted, 25) * 100) / 100,
        median: Math.round(percentile(sorted, 50) * 100) / 100,
        p75: Math.round(percentile(sorted, 75) * 100) / 100,
        mean: Math.round(mean(values) * 100) / 100,
        stddev: Math.round(stddev(values) * 100) / 100,
        quarter,
      });
    }

    return benchmarks;
  } catch (err) {
    console.error('[Benchmarks] Shop health computation failed:', (err as Error).message);
    return [];
  }
}

// ============================================================================
// MASTER AGGREGATION
// ============================================================================

/**
 * Run all benchmark computations and store results.
 * Called on a schedule (daily) and on-demand via API.
 */
export async function computeAllBenchmarks(quarter?: string) {
  const q = quarter || getCurrentQuarter();
  console.log(`[Benchmarks] Computing benchmarks for ${q}...`);

  const allBenchmarks = [
    ...await computeServicePricingBenchmarks(q),
    ...await computeMarginBenchmarks(q),
    ...await computeVehicleIntelligence(q),
    ...await computePartsMarkupBenchmarks(q),
    ...await computeShopHealthBenchmarks(q),
  ];

  if (allBenchmarks.length === 0) {
    console.log('[Benchmarks] No benchmarks to compute (insufficient data)');
    return { computed: 0 };
  }

  // Upsert benchmarks (delete existing for this quarter, then insert fresh)
  try {
    await database.delete(schema.intelligenceBenchmarks)
      .where(eq(schema.intelligenceBenchmarks.quarter, q));

    for (const b of allBenchmarks) {
      await database.insert(schema.intelligenceBenchmarks).values(b);
    }

    console.log(`[Benchmarks] ✅ Computed ${allBenchmarks.length} benchmarks for ${q}`);
    return { computed: allBenchmarks.length, quarter: q };
  } catch (err) {
    console.error('[Benchmarks] Storage failed:', (err as Error).message);
    return { computed: 0, error: (err as Error).message };
  }
}

/**
 * Get benchmarks for a specific type and dimension.
 * This is the public-facing query used by API consumers.
 */
export async function getBenchmark(type: string, dimension: string, quarter?: string) {
  const q = quarter || getCurrentQuarter();
  
  return database.query.intelligenceBenchmarks.findFirst({
    where: and(
      eq(schema.intelligenceBenchmarks.benchmarkType, type),
      eq(schema.intelligenceBenchmarks.dimension, dimension),
      eq(schema.intelligenceBenchmarks.quarter, q),
    ),
  });
}

/**
 * Get all benchmarks of a given type.
 */
export async function getBenchmarksByType(type: string, quarter?: string) {
  const q = quarter || getCurrentQuarter();
  
  return database.query.intelligenceBenchmarks.findMany({
    where: and(
      eq(schema.intelligenceBenchmarks.benchmarkType, type),
      eq(schema.intelligenceBenchmarks.quarter, q),
    ),
    orderBy: desc(schema.intelligenceBenchmarks.sampleSize),
  });
}

/**
 * Get a summary of all collected intelligence data.
 */
export async function getIntelligenceSummary() {
  const quarter = getCurrentQuarter();
  
  try {
    const [jobCount] = await database.select({ 
      count: sql<number>`count(*)` 
    }).from(schema.intelligenceJobSignals)
      .where(eq(schema.intelligenceJobSignals.quarter, quarter));

    const [partCount] = await database.select({ 
      count: sql<number>`count(*)` 
    }).from(schema.intelligencePartSignals)
      .where(eq(schema.intelligencePartSignals.quarter, quarter));

    const [bookingCount] = await database.select({ 
      count: sql<number>`count(*)` 
    }).from(schema.intelligenceBookingSignals)
      .where(eq(schema.intelligenceBookingSignals.quarter, quarter));

    const [healthCount] = await database.select({ 
      count: sql<number>`count(*)` 
    }).from(schema.intelligenceShopHealth)
      .where(eq(schema.intelligenceShopHealth.quarter, quarter));

    const [benchmarkCount] = await database.select({ 
      count: sql<number>`count(*)` 
    }).from(schema.intelligenceBenchmarks)
      .where(eq(schema.intelligenceBenchmarks.quarter, quarter));

    // Count unique shops
    const uniqueShops = await database.selectDistinct({ 
      anonShopId: schema.intelligenceJobSignals.anonShopId 
    }).from(schema.intelligenceJobSignals)
      .where(eq(schema.intelligenceJobSignals.quarter, quarter));

    return {
      quarter,
      signals: {
        jobs: jobCount?.count || 0,
        parts: partCount?.count || 0,
        bookings: bookingCount?.count || 0,
        healthSnapshots: healthCount?.count || 0,
      },
      benchmarks: benchmarkCount?.count || 0,
      uniqueShops: uniqueShops.length,
      dataPoints: (jobCount?.count || 0) + (partCount?.count || 0) + (bookingCount?.count || 0),
    };
  } catch (err) {
    return {
      quarter,
      signals: { jobs: 0, parts: 0, bookings: 0, healthSnapshots: 0 },
      benchmarks: 0,
      uniqueShops: 0,
      dataPoints: 0,
      error: (err as Error).message,
    };
  }
}
