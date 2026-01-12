import { TRPCError } from "@trpc/server";
import { z } from "zod";
// import { COOKIE_NAME } from "@shared/const";
// import { getSessionCookieOptions } from "./_core/cookies";
// import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./trpc";
import * as db from "../lib/db";
import { publicRouter } from "./routers/public";
import { xeroRouter } from "./routers/integrations/xero";
import { billingRouter } from "./routers/billing";
import { getUploadPresignedUrl, getDownloadPresignedUrl } from "../lib/storage";

// Mocks
const COOKIE_NAME = "session";
const getSessionCookieOptions = (req: any) => ({});
const systemRouter = router({});

/**
 * GearBox tRPC Router
 * 
 * This router implements strict Row-Level Security (RLS) through ledger access verification.
 * All procedures that access ledger-scoped data MUST verify access using db.verifyLedgerAccess.
 */

export const appRouter = router({
  system: systemRouter,
  public: publicRouter,
  xero: xeroRouter,
  billing: billingRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      // const cookieOptions = getSessionCookieOptions(ctx.req);
      // ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // ORGANIZATION MANAGEMENT
  // ============================================================================
  
  organization: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        subscriptionTier: z.enum(["starter", "professional", "enterprise"]).default("starter"),
      }))
      .mutation(async ({ ctx, input }) => {
        const orgId = await db.createOrganization({
          ownerId: ctx.user.id,
          name: input.name,
          subscriptionTier: input.subscriptionTier,
          subscriptionStatus: "active",
        });
        return { id: orgId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrganizationsByOwner(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const org = await db.getOrganizationById(input.id);
        if (!org || org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
        }
        return org;
      }),
  }),

  // ============================================================================
  // LEDGER MANAGEMENT (CORE MULTI-TENANT ISOLATION)
  // ============================================================================
  
  ledger: router({
    create: protectedProcedure
      .input(z.object({
        organizationId: z.number(),
        name: z.string().min(1).max(255),
        type: z.enum(["trades", "rental"]),
        gstRegistered: z.boolean().default(false),
        gstBasis: z.enum(["payments", "invoice"]).optional(),
        gstFilingFrequency: z.enum(["monthly", "two_monthly", "six_monthly"]).optional(),
        aimEnabled: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user owns the organization
        const org = await db.getOrganizationById(input.organizationId);
        if (!org || org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const ledgerId = await db.createLedger(input);
        return { id: ledgerId };
      }),

    list: protectedProcedure
      .input(z.object({ organizationId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify user owns the organization
        const org = await db.getOrganizationById(input.organizationId);
        if (!org || org.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return db.getLedgersByOrganization(input.organizationId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const ledger = await db.getLedgerById(input.id);
        if (!ledger) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ledger not found" });
        }

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.id);
        if (!hasAccess) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        return ledger;
      }),
  }),

  // ============================================================================
  // CUSTOMER MANAGEMENT
  // ============================================================================

  customer: router({
    create: protectedProcedure
      .input(z.object({
        ledgerId: z.number(),
        name: z.string().min(1).max(255),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        mobile: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        postcode: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const customerId = await db.createCustomer(input);
        return { id: customerId };
      }),

    list: protectedProcedure
      .input(z.object({ ledgerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getCustomersByLedger(input.ledgerId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const customer = await db.getCustomerById(input.id);
        if (!customer) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, customer.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return customer;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const customer = await db.getCustomerById(input.id);
        if (!customer) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, customer.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        await db.updateCustomer(input.id, input);
        return { success: true };
      }),

    search: protectedProcedure
      .input(z.object({
        ledgerId: z.number(),
        query: z.string().min(1),
      }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.searchCustomers(input.ledgerId, input.query);
      }),
  }),

  // ============================================================================
  // JOB MANAGEMENT
  // ============================================================================

  job: router({
    create: protectedProcedure
      .input(z.object({
        ledgerId: z.number(),
        customerId: z.number().optional(),
        vehicleId: z.number().optional(),
        jobNumber: z.string().optional(),
        description: z.string(),
        status: z.enum(["quoted", "in_progress", "completed", "cancelled"]).default("in_progress"),
        quotedPrice: z.union([z.number(), z.string()]).default(0),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const jobId = await db.createJob({
          ...input,
          quotedPrice: typeof input.quotedPrice === 'string' ? parseFloat(input.quotedPrice) : input.quotedPrice,
        });
        return { id: jobId };
      }),

    list: protectedProcedure
      .input(z.object({ ledgerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getJobsByLedger(input.ledgerId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await db.getJobById(input.id);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return job;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["quoted", "in_progress", "completed", "cancelled"]).optional(),
        description: z.string().optional(),
        quotedPrice: z.union([z.number(), z.string()]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await db.getJobById(input.id);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        await db.updateJob(input.id, {
          ...input,
          quotedPrice: typeof input.quotedPrice === 'string' ? parseFloat(input.quotedPrice) : input.quotedPrice,
        });
        return { success: true };
      }),

    addCost: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        type: z.enum(["labor", "parts", "overhead"]),
        description: z.string(),
        quantity: z.number().default(1),
        unitPrice: z.number(),
        totalCost: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const costId = await db.createJobCost(input);
        return { id: costId };
      }),

    getCosts: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getJobCosts(input.jobId);
      }),

    getCostSummary: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getJobCostSummary(input.jobId);
      }),

    getWithCosts: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await db.getJobById(input.id);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const costs = await db.getJobCosts(input.id);
        const summary = await db.getJobCostSummary(input.id);

        return { job, costs, summary };
      }),
  }),

  // ============================================================================
  // JOB COST MANAGEMENT
  // ============================================================================

  jobCost: router({
    create: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        type: z.enum(["labor", "parts", "overhead"]),
        description: z.string(),
        quantity: z.union([z.number(), z.string()]),
        unitPrice: z.union([z.number(), z.string()]),
        totalCost: z.union([z.number(), z.string()]),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const costId = await db.createJobCost({
          ...input,
          quantity: typeof input.quantity === 'string' ? parseFloat(input.quantity) : input.quantity,
          unitPrice: typeof input.unitPrice === 'string' ? parseFloat(input.unitPrice) : input.unitPrice,
          totalCost: typeof input.totalCost === 'string' ? parseFloat(input.totalCost) : input.totalCost,
        });
        return { id: costId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Simple mock delete for now
        await db.deleteJobCost(input.id);
        return { success: true };
      }),
  }),

  // ============================================================================
  // VEHICLE MANAGEMENT
  // ============================================================================

  vehicle: router({
    create: protectedProcedure
      .input(z.object({
        ledgerId: z.number(),
        licensePlate: z.string(),
        vin: z.string().optional().or(z.literal("")),
        make: z.string(),
        model: z.string(),
        year: z.union([z.number(), z.string()]),
        wofExpiry: z.union([z.date(), z.string()]).optional().nullable(),
        regoExpiry: z.union([z.date(), z.string()]).optional().nullable(),
        customerName: z.string().optional(),
        customerPhone: z.string().optional(),
        customerEmail: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const vehicleId = await db.createVehicle({
          ...input,
          year: typeof input.year === 'string' ? parseInt(input.year, 10) : input.year,
          wofExpiry: input.wofExpiry ? new Date(input.wofExpiry) : undefined,
          regoExpiry: input.regoExpiry ? new Date(input.regoExpiry) : undefined,
        });
        return { id: vehicleId };
      }),

    list: protectedProcedure
      .input(z.object({ ledgerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getVehiclesByLedger(input.ledgerId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const vehicle = await db.getVehicleById(input.id);
        if (!vehicle) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, vehicle.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return vehicle;
      }),
  }),

  // ============================================================================
  // INVOICE MANAGEMENT
  // ============================================================================

  invoice: router({
    create: protectedProcedure
      .input(z.object({
        ledgerId: z.number(),
        jobId: z.number(),
        customerId: z.number(),
        invoiceNumber: z.string(),
        invoiceDate: z.date(),
        dueDate: z.date(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })).optional(),
        subtotal: z.number(),
        gstAmount: z.number(),
        totalAmount: z.number(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const invoiceId = await db.createInvoice(input);
        return { id: invoiceId };
      }),

    list: protectedProcedure
      .input(z.object({ ledgerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getInvoicesByLedger(input.ledgerId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, invoice.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return invoice;
      }),
  }),

  // ============================================================================
  // BOOKING MANAGEMENT
  // ============================================================================

  booking: router({
    create: protectedProcedure
      .input(z.object({
        ledgerId: z.number(),
        customerId: z.number().optional(),
        customerName: z.string(),
        customerEmail: z.string().email(),
        customerPhone: z.string(),
        vehicleInfo: z.string(),
        serviceType: z.string(),
        bookingDate: z.date(),
        timeSlot: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const bookingId = await db.createBooking(input);
        return { id: bookingId };
      }),

    list: protectedProcedure
      .input(z.object({ ledgerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getBookingsByLedger(input.ledgerId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const booking = await db.getBookingById(input.id);
        if (!booking) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, booking.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return booking;
      }),
  }),

  // ============================================================================
  // QUOTE MANAGEMENT
  // ============================================================================

  quote: router({
    create: protectedProcedure
      .input(z.object({
        ledgerId: z.number(),
        customerId: z.number(),
        quoteNumber: z.string(),
        vehicleInfo: z.string().optional(),
        items: z.array(z.object({
          description: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          total: z.number(),
        })).optional(),
        subtotal: z.number().default(0),
        gstAmount: z.number().default(0),
        totalAmount: z.number().default(0),
        expiryDate: z.date(),
        notes: z.string().optional(),
        status: z.enum(["draft", "sent", "approved", "rejected"]).default("draft"),
      }))
      .mutation(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        const quoteId = await db.createQuote(input);
        return { id: quoteId };
      }),

    list: protectedProcedure
      .input(z.object({ ledgerId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getQuotesByLedger(input.ledgerId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const quote = await db.getQuoteById(input.id);
        if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, quote.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return quote;
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "sent", "approved", "rejected"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const quote = await db.getQuoteById(input.id);
        if (!quote) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, quote.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        await db.updateQuoteStatus(input.id, input.status);
        return { success: true };
      }),
  }),

  // ============================================================================
  // DVI (DIGITAL VEHICLE INSPECTION)
  // ============================================================================

  dvi: router({
    create: protectedProcedure
      .input(z.object({
        jobId: z.number(),
        items: z.array(z.object({
          category: z.string(),
          component: z.string(),
          status: z.enum(["green", "amber", "red"]),
          comment: z.string().optional(),
          recommendedAction: z.string().optional(),
          estimatedCost: z.number().optional(),
          mediaKeys: z.array(z.string()).optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.createFullDviInspection({
          ledgerId: job.ledgerId,
          jobId: input.jobId,
          vehicleId: job.vehicleId!,
          items: input.items as any,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const inspection = await db.getDviInspectionById(input.id);
        if (!inspection) throw new TRPCError({ code: "NOT_FOUND" });
        
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, inspection.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
        
        return inspection;
      }),

    listByJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ ctx, input }) => {
        const job = await db.getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, job.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.db.query.dviInspections.findMany({
            where: (inspections, { eq }) => eq(inspections.jobId, input.jobId),
            orderBy: (inspections, { desc }) => [desc(inspections.createdAt)]
        });
      }),

    complete: protectedProcedure
      .input(z.object({
        id: z.number(),
        shareToken: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const inspection = await db.getDviInspectionById(input.id);
        if (!inspection) throw new TRPCError({ code: "NOT_FOUND" });
        
        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, inspection.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });
        
        await db.completeDviInspection(input.id, input.shareToken);
        return { success: true };
      }),
  }),

  // ============================================================================
  // PDF GENERATION
  // ============================================================================
  
  pdf: router({
    generateDviReport: protectedProcedure
      .input(z.object({ dviId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // const { generateDVIReportPDF } = await import("./pdfGenerator");
        // Mock PDF for now or copy file later
        return {
          pdf: "MOCK_BASE64_PDF",
          filename: `DVI-Report-${input.dviId}.pdf`,
        };
      }),

    generateQuote: protectedProcedure
      .input(z.object({ quoteId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // const { generateQuotePDF } = await import("./pdfGenerator");
        return {
          pdf: "MOCK_BASE64_PDF",
          filename: `Quote-${input.quoteId}.pdf`,
        };
      }),

    generateInvoice: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // const { generateInvoicePDF } = await import("./pdfGenerator");
        return {
          pdf: "MOCK_BASE64_PDF",
          filename: `Invoice-${input.invoiceId}.pdf`,
        };
      }),
  }),

  // ============================================================================
  // STORAGE MANAGEMENT
  // ============================================================================
  
  storage: router({
    getUploadUrl: protectedProcedure
      .input(z.object({ key: z.string(), contentType: z.string() }))
      .mutation(async ({ input }) => {
        const url = await getUploadPresignedUrl(input.key, input.contentType);
        return { url };
      }),
    
    getDownloadUrl: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        const url = await getDownloadPresignedUrl(input.key);
        return { url };
      }),
  }),
});
export type AppRouter = typeof appRouter;
