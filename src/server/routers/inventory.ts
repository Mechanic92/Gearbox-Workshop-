
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";
import * as db from "../../lib/db.js";
import * as schema from "../../lib/schema.js";
import { eq, and, desc, like, sql } from 'drizzle-orm';
import { TRPCError } from "@trpc/server";
import { capturePartSignal } from "../../lib/intelligence/collector.js";

export const inventoryRouter = router({
  // ============================================================================
  // PARTS
  // ============================================================================

  getParts: protectedProcedure
    .input(z.object({
      ledgerId: z.number(),
      search: z.string().optional(),
      categoryId: z.number().optional(),
      supplierId: z.number().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const conditions = [eq(schema.parts.ledgerId, input.ledgerId), eq(schema.parts.isActive, true)];

      if (input.search) {
        conditions.push(
          sql`(${schema.parts.name} LIKE ${`%${input.search}%`} OR ${schema.parts.partNumber} LIKE ${`%${input.search}%`})`
        );
      }
      if (input.categoryId) conditions.push(eq(schema.parts.categoryId, input.categoryId));
      if (input.supplierId) conditions.push(eq(schema.parts.supplierId, input.supplierId));

      return db.db.query.parts.findMany({
        where: and(...conditions),
        limit: input.limit,
        offset: input.offset,
        with: {
            category: true,
            supplier: true
        } as any,
        orderBy: desc(schema.parts.updatedAt)
      });
    }),

  getPart: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const part = await db.db.query.parts.findFirst({
        where: eq(schema.parts.id, input.id),
        with: {
            category: true,
            supplier: true
        } as any
      });
      if (!part) throw new TRPCError({ code: "NOT_FOUND" });
      
      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, part.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      return part;
    }),

  createPart: protectedProcedure
    .input(z.object({
      ledgerId: z.number(),
      partNumber: z.string(),
      name: z.string(),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      supplierId: z.number().optional(),
      costPrice: z.number(),
      sellPrice: z.number(),
      stockQuantity: z.number().default(0),
      minStockLevel: z.number().default(0),
      unit: z.string().default("each"),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const { ledgerId, ...data } = input;
      const partId = await db.createPart({ ...data, ledgerId });
      
      // If initial stock is > 0, record a movement
      if (input.stockQuantity > 0) {
        await db.recordStockMovement({
            partId,
            ledgerId,
            quantity: input.stockQuantity,
            movementType: 'adjustment',
            notes: 'Initial stock',
            createdBy: ctx.user.id
        });
      }

      // Silently capture anonymous pricing intelligence
      capturePartSignal(input.ledgerId, {
        name: input.name,
        costPrice: input.costPrice,
        sellPrice: input.sellPrice,
      });

      return { id: partId };
    }),

  updatePart: protectedProcedure
    .input(z.object({
      id: z.number(),
      partNumber: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      categoryId: z.number().optional(),
      supplierId: z.number().optional(),
      costPrice: z.number().optional(),
      sellPrice: z.number().optional(),
      minStockLevel: z.number().optional(),
      unit: z.string().optional(),
      location: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const part = await db.db.query.parts.findFirst({ where: eq(schema.parts.id, input.id) });
      if (!part) throw new TRPCError({ code: "NOT_FOUND" });

      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, part.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const { id, ...data } = input;
      await db.updatePart(id, data);
      return { success: true };
    }),

  // ============================================================================
  // SUPPLIERS
  // ============================================================================

  getSuppliers: protectedProcedure
    .input(z.object({ ledgerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      return db.getSuppliersByLedger(input.ledgerId);
    }),

  createSupplier: protectedProcedure
    .input(z.object({
      ledgerId: z.number(),
      name: z.string(),
      contactPerson: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      address: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      const { ledgerId, ...data } = input;
      const id = await db.createSupplier({ ...data, ledgerId });
      return { id };
    }),

  searchSupplierParts: protectedProcedure
    .input(z.object({ 
      ledgerId: z.number(),
      query: z.string(),
      vehicleRego: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await db.verifyLedgerAccess(ctx.user.id, input.ledgerId);
      if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

      // Simulated Bridge to Repco/BNT/CarJam APIs
      console.log(`🔍 [Supplier Bridge] Searching for "${input.query}" for ${input.vehicleRego || "General"}`);
      
      return [
          { source: "Repco API", sku: "OIL-5W30-5L", name: "Castrol Edge 5W-30 5L", price: 65.50, availability: "Local Branch" },
          { source: "BNT Bridge", sku: "FLT-Z123", name: "Ryco Oil Filter Z123", price: 12.20, availability: "Overnight" },
          { source: "Advance Parts", sku: "BRK-DB1200", name: "Bendix Brake Pads (Front)", price: 89.00, availability: "In Stock" },
      ];
    }),

  // ============================================================================
  // STOCK CONTROL
  // ============================================================================

  adjustStock: protectedProcedure
    .input(z.object({
        partId: z.number(),
        quantity: z.number(), // Positive to add, negative to remove
        movementType: z.enum(["purchase", "sale", "adjustment", "return", "transfer"]),
        notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
        const part = await db.db.query.parts.findFirst({ where: eq(schema.parts.id, input.partId) });
        if (!part) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, part.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        await db.recordStockMovement({
            partId: input.partId,
            ledgerId: part.ledgerId,
            quantity: input.quantity,
            movementType: input.movementType,
            notes: input.notes,
            createdBy: ctx.user.id
        });

        return { success: true };
    }),
    
  getStockHistory: protectedProcedure
    .input(z.object({ partId: z.number() }))
    .query(async ({ ctx, input }) => {
        const part = await db.db.query.parts.findFirst({ where: eq(schema.parts.id, input.partId) });
        if (!part) throw new TRPCError({ code: "NOT_FOUND" });

        const hasAccess = await db.verifyLedgerAccess(ctx.user.id, part.ledgerId);
        if (!hasAccess) throw new TRPCError({ code: "FORBIDDEN" });

        return db.getStockMovements(part.ledgerId, input.partId);
    }),
});
