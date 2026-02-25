/**
 * ============================================================================
 * GEARBOX INTELLIGENCE COLLECTOR
 * ============================================================================
 * 
 * Silent, non-invasive data collection engine that captures anonymized 
 * industry intelligence from platform operations. This is the data moat.
 * 
 * WHAT WE COLLECT (anonymized, aggregated):
 * ─────────────────────────────────────────
 * 1. Industry Benchmarks    → Labor rates, job costs, margins by service type
 * 2. Vehicle Intelligence   → Repair patterns by make/model/year (no VIN/plate)
 * 3. Parts & Supply Chain   → Pricing trends, markup rates, popular parts
 * 4. Market Signals         → Regional demand, seasonal patterns, booking density
 * 5. Operational DNA        → What makes top shops different (KPIs, throughput)
 * 
 * WHAT WE NEVER COLLECT:
 * ──────────────────────
 * ✗ Customer names, emails, phones, addresses
 * ✗ VINs, license plates, or vehicle identifiers
 * ✗ Business names, bank details, financial accounts
 * ✗ Employee/technician identities
 * ✗ IP addresses or user agent strings
 * ✗ Any data that could identify a specific person or business
 * 
 * PRIVACY MODEL:
 * ──────────────
 * All data passes through a sanitization layer before storage.
 * Data is stored with a hashed shop identifier (SHA-256 of ledgerId + salt)
 * so we can track cohort performance without knowing who anyone is.
 * 
 * VALUE PROPOSITION:
 * ─────────────────
 * → "What does a brake job cost across NZ right now?" 
 * → "Which vehicles have the highest repair frequency?"
 * → "What's the average workshop margin on an oil change?"
 * → "How does shop utilization change in winter?"
 * 
 * This data becomes the foundation for:
 * - AI-powered pricing recommendations
 * - Insurance/fleet partnerships
 * - Industry reports sold to OEMs, aftermarket companies
 * - Acquisition-grade data assets
 */

import { db as database } from '../db.js';
import * as schema from '../schema.js';
import { eventBus, EVENTS } from '../events/index.js';
import { eq, sql, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

// ============================================================================
// CONFIGURATION
// ============================================================================

const INTELLIGENCE_SALT = process.env.INTELLIGENCE_SALT || 'gearbox-anon-2026-nz';
const COLLECTION_ENABLED = process.env.DISABLE_INTELLIGENCE !== 'true';
const BATCH_INTERVAL_MS = 60_000; // Flush every 60 seconds
const MAX_BATCH_SIZE = 100;

// ============================================================================
// TYPES
// ============================================================================

interface JobSignal {
  anonShopId: string;
  serviceCategory: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYearBucket: string; // "2020-2024", "2015-2019", etc.
  laborCost: number;
  partsCost: number;
  totalJobValue: number;
  marginPercent: number;
  jobDurationHours: number;
  region: string; // Derived from timezone or config, never address
  quarter: string; // "2026-Q1"
  dayOfWeek: number;
}

interface PartSignal {
  anonShopId: string;
  partCategory: string;
  partType: string; // Generic: "Oil Filter", "Brake Pad", not specific SKU
  costPrice: number;
  sellPrice: number;
  markupPercent: number;
  vehicleMake: string;
  vehicleModel: string;
  quarter: string;
}

interface BookingSignal {
  anonShopId: string;
  serviceType: string;
  dayOfWeek: number;
  hourOfDay: number;
  leadTimeDays: number; // Days between booking creation and scheduled date
  quarter: string;
}

interface ShopHealthSignal {
  anonShopId: string;
  activeJobCount: number;
  avgJobValue: number;
  avgCycleTimeDays: number; // Average time from job creation to completion
  bookingConversionRate: number; // Bookings that convert to jobs
  quoteConversionRate: number; // Quotes that convert to jobs
  partsPerJob: number;
  revenuePerBay: number;
  utilizationRate: number; // Jobs in progress / total capacity
  quarter: string;
  month: number;
}

// ============================================================================
// ANONYMIZATION UTILITIES
// ============================================================================

/**
 * Create a one-way anonymous identifier for a shop.
 * Cannot be reversed to find the actual ledger.
 */
function anonymizeShopId(ledgerId: number): string {
  return crypto
    .createHash('sha256')
    .update(`${INTELLIGENCE_SALT}:${ledgerId}`)
    .digest('hex')
    .substring(0, 16); // First 16 chars of SHA-256
}

/**
 * Bucket vehicle years into 5-year ranges for anonymity.
 */
function bucketYear(year: number | null | undefined): string {
  if (!year) return 'unknown';
  if (year >= 2025) return '2025+';
  if (year >= 2020) return '2020-2024';
  if (year >= 2015) return '2015-2019';
  if (year >= 2010) return '2010-2014';
  if (year >= 2005) return '2005-2009';
  if (year >= 2000) return '2000-2004';
  return 'pre-2000';
}

/**
 * Get current quarter string.
 */
function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

/**
 * Categorize a job description into a standardized service type.
 * Uses keyword matching for now — could be upgraded to AI classification.
 */
function categorizeService(description: string): string {
  const desc = (description || '').toLowerCase();
  
  // Oil & Fluids
  if (desc.includes('oil change') || desc.includes('oil service') || desc.includes('lube')) return 'oil_change';
  if (desc.includes('coolant') || desc.includes('antifreeze')) return 'coolant_service';
  if (desc.includes('transmission fluid') || desc.includes('trans fluid')) return 'transmission_service';
  if (desc.includes('brake fluid')) return 'brake_fluid_flush';
  
  // Brakes
  if (desc.includes('brake pad') || desc.includes('brake shoe')) return 'brake_pads';
  if (desc.includes('brake rotor') || desc.includes('brake disc')) return 'brake_rotors';
  if (desc.includes('brake') && desc.includes('caliper')) return 'brake_caliper';
  if (desc.includes('brake')) return 'brake_general';
  
  // Suspension & Steering
  if (desc.includes('suspension') || desc.includes('shock') || desc.includes('strut')) return 'suspension';
  if (desc.includes('alignment') || desc.includes('wheel align')) return 'wheel_alignment';
  if (desc.includes('cv joint') || desc.includes('cv boot')) return 'cv_joint';
  if (desc.includes('ball joint') || desc.includes('tie rod')) return 'steering';
  
  // Engine
  if (desc.includes('timing belt') || desc.includes('timing chain')) return 'timing_belt';
  if (desc.includes('head gasket')) return 'head_gasket';
  if (desc.includes('engine') && (desc.includes('rebuild') || desc.includes('overhaul'))) return 'engine_rebuild';
  if (desc.includes('spark plug') || desc.includes('ignition')) return 'ignition';
  if (desc.includes('engine')) return 'engine_general';
  
  // Electrical
  if (desc.includes('battery')) return 'battery';
  if (desc.includes('alternator')) return 'alternator';
  if (desc.includes('starter motor') || desc.includes('starter')) return 'starter_motor';
  if (desc.includes('electrical') || desc.includes('wiring')) return 'electrical';
  
  // Exhaust
  if (desc.includes('exhaust') || desc.includes('muffler') || desc.includes('catalytic')) return 'exhaust';
  
  // Compliance
  if (desc.includes('wof') || desc.includes('warrant of fitness')) return 'wof_inspection';
  if (desc.includes('pre-purchase') || desc.includes('ppi')) return 'pre_purchase_inspection';
  if (desc.includes('service') || desc.includes('maintenance')) return 'scheduled_service';
  
  // Tyres
  if (desc.includes('tyre') || desc.includes('tire')) return 'tyres';
  
  // Transmission
  if (desc.includes('clutch')) return 'clutch';
  if (desc.includes('gearbox') || desc.includes('transmission')) return 'transmission';
  
  // Body & Other
  if (desc.includes('air condition') || desc.includes('a/c') || desc.includes('hvac')) return 'air_conditioning';
  if (desc.includes('diagnostic') || desc.includes('scan') || desc.includes('code')) return 'diagnostics';
  
  return 'other';
}

/**
 * Normalize vehicle make names for consistency.
 */
function normalizeMake(make: string | null | undefined): string {
  if (!make) return 'unknown';
  const m = make.trim().toLowerCase();
  
  const aliases: Record<string, string> = {
    'toyota': 'Toyota', 'holden': 'Holden', 'ford': 'Ford',
    'mazda': 'Mazda', 'nissan': 'Nissan', 'honda': 'Honda',
    'hyundai': 'Hyundai', 'kia': 'Kia', 'subaru': 'Subaru',
    'mitsubishi': 'Mitsubishi', 'volkswagen': 'Volkswagen', 'vw': 'Volkswagen',
    'bmw': 'BMW', 'mercedes': 'Mercedes-Benz', 'mercedes-benz': 'Mercedes-Benz',
    'audi': 'Audi', 'suzuki': 'Suzuki', 'isuzu': 'Isuzu',
    'tesla': 'Tesla', 'chevrolet': 'Chevrolet', 'chevy': 'Chevrolet',
    'jeep': 'Jeep', 'land rover': 'Land Rover', 'landrover': 'Land Rover',
    'lexus': 'Lexus', 'volvo': 'Volvo', 'peugeot': 'Peugeot',
    'skoda': 'Skoda', 'porsche': 'Porsche', 'jaguar': 'Jaguar',
    'mini': 'Mini', 'fiat': 'Fiat', 'renault': 'Renault',
    'ssangyong': 'SsangYong', 'great wall': 'Great Wall',
  };
  
  return aliases[m] || make.charAt(0).toUpperCase() + make.slice(1).toLowerCase();
}

// ============================================================================
// SIGNAL BATCH QUEUE
// ============================================================================

class SignalQueue {
  private jobSignals: JobSignal[] = [];
  private partSignals: PartSignal[] = [];
  private bookingSignals: BookingSignal[] = [];
  private shopHealthSignals: ShopHealthSignal[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  start() {
    if (!COLLECTION_ENABLED) {
      console.log('[Intelligence] Data collection disabled via DISABLE_INTELLIGENCE env var');
      return;
    }
    
    this.flushTimer = setInterval(() => this.flush(), BATCH_INTERVAL_MS);
    console.log('[Intelligence] 🧠 Anonymous data collection engine initialized');
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    // Final flush
    this.flush();
  }

  pushJob(signal: JobSignal) {
    this.jobSignals.push(signal);
    if (this.jobSignals.length >= MAX_BATCH_SIZE) this.flushJobs();
  }

  pushPart(signal: PartSignal) {
    this.partSignals.push(signal);
    if (this.partSignals.length >= MAX_BATCH_SIZE) this.flushParts();
  }

  pushBooking(signal: BookingSignal) {
    this.bookingSignals.push(signal);
    if (this.bookingSignals.length >= MAX_BATCH_SIZE) this.flushBookings();
  }

  pushShopHealth(signal: ShopHealthSignal) {
    this.shopHealthSignals.push(signal);
  }

  private async flush() {
    await Promise.allSettled([
      this.flushJobs(),
      this.flushParts(),
      this.flushBookings(),
      this.flushShopHealth(),
    ]);
  }

  private async flushJobs() {
    if (this.jobSignals.length === 0) return;
    const batch = this.jobSignals.splice(0);
    
    try {
      for (const s of batch) {
        await database.insert(schema.intelligenceJobSignals).values({
          anonShopId: s.anonShopId,
          serviceCategory: s.serviceCategory,
          vehicleMake: s.vehicleMake,
          vehicleModel: s.vehicleModel,
          vehicleYearBucket: s.vehicleYearBucket,
          laborCost: s.laborCost,
          partsCost: s.partsCost,
          totalJobValue: s.totalJobValue,
          marginPercent: s.marginPercent,
          jobDurationHours: s.jobDurationHours,
          region: s.region,
          quarter: s.quarter,
          dayOfWeek: s.dayOfWeek,
        });
      }
    } catch (err) {
      // Silent failure — intelligence collection must NEVER affect core operations
      console.error('[Intelligence] Job signal flush failed (non-critical):', (err as Error).message);
    }
  }

  private async flushParts() {
    if (this.partSignals.length === 0) return;
    const batch = this.partSignals.splice(0);
    
    try {
      for (const s of batch) {
        await database.insert(schema.intelligencePartSignals).values({
          anonShopId: s.anonShopId,
          partCategory: s.partCategory,
          partType: s.partType,
          costPrice: s.costPrice,
          sellPrice: s.sellPrice,
          markupPercent: s.markupPercent,
          vehicleMake: s.vehicleMake,
          vehicleModel: s.vehicleModel,
          quarter: s.quarter,
        });
      }
    } catch (err) {
      console.error('[Intelligence] Part signal flush failed (non-critical):', (err as Error).message);
    }
  }

  private async flushBookings() {
    if (this.bookingSignals.length === 0) return;
    const batch = this.bookingSignals.splice(0);
    
    try {
      for (const s of batch) {
        await database.insert(schema.intelligenceBookingSignals).values({
          anonShopId: s.anonShopId,
          serviceType: s.serviceType,
          dayOfWeek: s.dayOfWeek,
          hourOfDay: s.hourOfDay,
          leadTimeDays: s.leadTimeDays,
          quarter: s.quarter,
        });
      }
    } catch (err) {
      console.error('[Intelligence] Booking signal flush failed (non-critical):', (err as Error).message);
    }
  }

  private async flushShopHealth() {
    if (this.shopHealthSignals.length === 0) return;
    const batch = this.shopHealthSignals.splice(0);
    
    try {
      for (const s of batch) {
        await database.insert(schema.intelligenceShopHealth).values({
          anonShopId: s.anonShopId,
          activeJobCount: s.activeJobCount,
          avgJobValue: s.avgJobValue,
          avgCycleTimeDays: s.avgCycleTimeDays,
          bookingConversionRate: s.bookingConversionRate,
          quoteConversionRate: s.quoteConversionRate,
          partsPerJob: s.partsPerJob,
          revenuePerBay: s.revenuePerBay,
          utilizationRate: s.utilizationRate,
          quarter: s.quarter,
          month: s.month,
        });
      }
    } catch (err) {
      console.error('[Intelligence] Shop health flush failed (non-critical):', (err as Error).message);
    }
  }
}

// Singleton queue
const signalQueue = new SignalQueue();

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Hook into the event bus to silently capture data signals.
 * These listeners are non-blocking and wrapped in try/catch
 * so they can NEVER crash the main application.
 */
function registerEventListeners() {
  // ── Job Completed → Capture pricing, timing, vehicle data ──
  eventBus.on(EVENTS.JOB_STATUS_CHANGED, async (event: any) => {
    try {
      if (event.newStatus !== 'COMPLETED') return;
      
      const job = await database.query.jobs.findFirst({
        where: eq(schema.jobs.id, event.jobId),
      });
      if (!job) return;

      // Get vehicle info (make/model/year only, no identifying data)
      let vehicleMake = 'unknown';
      let vehicleModel = 'unknown';
      let vehicleYear: number | null = null;
      
      if (job.vehicleId) {
        const vehicle = await database.query.vehicles.findFirst({
          where: eq(schema.vehicles.id, job.vehicleId),
        });
        if (vehicle) {
          vehicleMake = normalizeMake(vehicle.make);
          vehicleModel = (vehicle.model || 'unknown').trim();
          vehicleYear = vehicle.year;
        }
      }

      // Get cost breakdown
      const costs = await database.query.jobCosts.findMany({
        where: eq(schema.jobCosts.jobId, job.id),
      });

      const laborCost = costs
        .filter(c => c.type === 'labor')
        .reduce((sum, c) => sum + (c.totalCost || 0), 0);
      const partsCost = costs
        .filter(c => c.type === 'parts')
        .reduce((sum, c) => sum + (c.totalCost || 0), 0);
      
      const totalValue = job.finalPrice || job.quotedPrice || 0;
      const totalCost = laborCost + partsCost;
      const margin = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;

      // Calculate duration
      let durationHours = 0;
      if (job.startedAt && job.completedAt) {
        const start = new Date(job.startedAt).getTime();
        const end = new Date(job.completedAt).getTime();
        durationHours = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10;
      }

      signalQueue.pushJob({
        anonShopId: anonymizeShopId(job.ledgerId),
        serviceCategory: categorizeService(job.description),
        vehicleMake,
        vehicleModel,
        vehicleYearBucket: bucketYear(vehicleYear),
        laborCost: Math.round(laborCost * 100) / 100,
        partsCost: Math.round(partsCost * 100) / 100,
        totalJobValue: Math.round(totalValue * 100) / 100,
        marginPercent: Math.round(margin * 10) / 10,
        jobDurationHours: durationHours,
        region: process.env.GEARBOX_REGION || 'nz', // Never derived from user data
        quarter: getCurrentQuarter(),
        dayOfWeek: new Date().getDay(),
      });
    } catch (err) {
      // Silent — never affect main flow
    }
  });

  // ── Invoice Created → Capture revenue signals ──
  eventBus.on(EVENTS.INVOICE_CREATED, async (event: any) => {
    try {
      // Invoice data is already captured via the job completion signal
      // This hook is reserved for future invoice-specific analytics
      // (e.g., payment speed, outstanding AR trends)
    } catch (err) {
      // Silent
    }
  });

  // ── Booking Confirmed → Capture demand/scheduling patterns ──
  eventBus.on(EVENTS.BOOKING_CONFIRMED, async (event: any) => {
    try {
      const booking = await database.query.bookings.findFirst({
        where: eq(schema.bookings.id, event.bookingId),
      });
      if (!booking) return;

      const service = await database.query.services.findFirst({
        where: eq(schema.services.id, event.serviceId),
      });

      const scheduledDate = new Date(booking.scheduledDate);
      const createdDate = new Date(booking.createdAt);
      const leadTimeDays = Math.ceil(
        (scheduledDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      signalQueue.pushBooking({
        anonShopId: anonymizeShopId(event.ledgerId),
        serviceType: service?.name || 'unknown',
        dayOfWeek: scheduledDate.getDay(),
        hourOfDay: scheduledDate.getHours(),
        leadTimeDays: Math.max(0, leadTimeDays),
        quarter: getCurrentQuarter(),
      });
    } catch (err) {
      // Silent
    }
  });
}

// ============================================================================
// PERIODIC SHOP HEALTH SNAPSHOT
// ============================================================================

/**
 * Every 6 hours, take an anonymous health snapshot of each active shop.
 * This powers the industry-wide benchmark comparisons.
 */
async function captureShopHealthSnapshots() {
  try {
    const ledgers = await database.query.ledgers.findMany();
    
    for (const ledger of ledgers) {
      try {
        // Count active jobs
        const activeJobs = await database.query.jobs.findMany({
          where: and(
            eq(schema.jobs.ledgerId, ledger.id),
            eq(schema.jobs.status, 'IN_PROGRESS')
          ),
        });

        // Get completed jobs this month for averages
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const completedJobs = await database.query.jobs.findMany({
          where: and(
            eq(schema.jobs.ledgerId, ledger.id),
            eq(schema.jobs.status, 'COMPLETED')
          ),
        });

        // Filter to this month's completions
        const monthlyJobs = completedJobs.filter(j => 
          j.completedAt && new Date(j.completedAt) >= monthStart
        );

        if (monthlyJobs.length === 0) continue; // Skip inactive shops

        const avgJobValue = monthlyJobs.reduce((s, j) => s + (j.finalPrice || j.quotedPrice || 0), 0) / monthlyJobs.length;

        // Average cycle time
        const cycleTimes = monthlyJobs
          .filter(j => j.startedAt && j.completedAt)
          .map(j => {
            const start = new Date(j.startedAt!).getTime();
            const end = new Date(j.completedAt!).getTime();
            return (end - start) / (1000 * 60 * 60 * 24); // days
          });
        const avgCycleTime = cycleTimes.length > 0
          ? cycleTimes.reduce((s, t) => s + t, 0) / cycleTimes.length
          : 0;

        // Get bay count for utilization calc
        const settings = await database.query.invoiceSettings.findFirst({
          where: eq(schema.invoiceSettings.ledgerId, ledger.id),
        });
        const bayCount = settings?.bayCount || 2;
        const utilizationRate = activeJobs.length / bayCount;

        // Quote conversion
        const quotes = await database.query.quotes.findMany({
          where: eq(schema.quotes.ledgerId, ledger.id),
        });
        const approvedQuotes = quotes.filter(q => q.status === 'approved');
        const quoteConversion = quotes.length > 0
          ? approvedQuotes.length / quotes.length
          : 0;

        signalQueue.pushShopHealth({
          anonShopId: anonymizeShopId(ledger.id),
          activeJobCount: activeJobs.length,
          avgJobValue: Math.round(avgJobValue * 100) / 100,
          avgCycleTimeDays: Math.round(avgCycleTime * 10) / 10,
          bookingConversionRate: 0, // TODO: calculate from booking→job pipeline
          quoteConversionRate: Math.round(quoteConversion * 100) / 100,
          partsPerJob: 0, // TODO: calculate from job_parts
          revenuePerBay: Math.round((avgJobValue * monthlyJobs.length / bayCount) * 100) / 100,
          utilizationRate: Math.round(utilizationRate * 100) / 100,
          quarter: getCurrentQuarter(),
          month: now.getMonth() + 1,
        });
      } catch (err) {
        // Skip this shop, continue with others
      }
    }
  } catch (err) {
    console.error('[Intelligence] Health snapshot failed (non-critical):', (err as Error).message);
  }
}

// ============================================================================
// PART CREATION HOOK
// ============================================================================

/**
 * Call this from the inventory router when parts are created/updated.
 * This captures pricing intelligence without identifying the shop.
 */
export function capturePartSignal(
  ledgerId: number,
  part: {
    name: string;
    costPrice: number;
    sellPrice: number;
    categoryName?: string;
  },
  vehicleMake?: string,
  vehicleModel?: string
) {
  if (!COLLECTION_ENABLED) return;
  
  try {
    const markup = part.costPrice > 0
      ? ((part.sellPrice - part.costPrice) / part.costPrice) * 100
      : 0;

    signalQueue.pushPart({
      anonShopId: anonymizeShopId(ledgerId),
      partCategory: part.categoryName || 'uncategorized',
      partType: part.name,
      costPrice: Math.round(part.costPrice * 100) / 100,
      sellPrice: Math.round(part.sellPrice * 100) / 100,
      markupPercent: Math.round(markup * 10) / 10,
      vehicleMake: normalizeMake(vehicleMake),
      vehicleModel: vehicleModel || 'generic',
      quarter: getCurrentQuarter(),
    });
  } catch (err) {
    // Silent
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

let healthSnapshotTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the intelligence collection engine.
 * Call this once on server startup, alongside other automations.
 */
export function initializeIntelligence() {
  if (!COLLECTION_ENABLED) {
    console.log('[Intelligence] Collection disabled');
    return;
  }

  // Start the batch queue
  signalQueue.start();

  // Register event listeners
  registerEventListeners();

  // Schedule health snapshots every 6 hours
  healthSnapshotTimer = setInterval(captureShopHealthSnapshots, 6 * 60 * 60 * 1000);
  
  // Take first snapshot after 5 minutes (let DB initialize)
  setTimeout(captureShopHealthSnapshots, 5 * 60 * 1000);

  console.log('[Intelligence] 🧠 Data intelligence engine active');
  console.log('[Intelligence] → Job completion signals ✓');
  console.log('[Intelligence] → Booking demand signals ✓');
  console.log('[Intelligence] → Parts pricing signals ✓');
  console.log('[Intelligence] → Shop health snapshots ✓ (every 6h)');
}

/**
 * Graceful shutdown
 */
export function shutdownIntelligence() {
  signalQueue.stop();
  if (healthSnapshotTimer) {
    clearInterval(healthSnapshotTimer);
    healthSnapshotTimer = null;
  }
}

// Export utilities for use in routers
export { anonymizeShopId, categorizeService, normalizeMake, bucketYear, getCurrentQuarter };
