import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from './schema.js';
import { eq, and, like, desc, sql } from "drizzle-orm";
import crypto from "node:crypto";

// Initialize LibSQL with remote support if DATABASE_URL is provided
const client = createClient({ 
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
});
export const db = drizzle(client, { schema });

// ============================================================================
// ACCESS CONTROL
// ============================================================================

export async function verifyLedgerAccess(userId: number, ledgerId: number): Promise<boolean> {
  const ledger = await db.query.ledgers.findFirst({
    where: eq(schema.ledgers.id, ledgerId),
  });
  
  if (!ledger) return false;

  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, ledger.organizationId)
  });

  if (org && org.ownerId === userId) return true;

  const access = await db.query.ledgerAccess.findFirst({
    where: and(
        eq(schema.ledgerAccess.ledgerId, ledgerId),
        eq(schema.ledgerAccess.userId, userId)
    )
  });

  return !!access;
}

export async function verifyOrganizationAccess(userId: number, organizationId: number): Promise<boolean> {
  const org = await db.query.organizations.findFirst({
    where: and(
        eq(schema.organizations.id, organizationId),
        eq(schema.organizations.ownerId, userId)
    )
  });
  
  return !!org;
}

// ============================================================================
// ORGANIZATIONS
// ============================================================================

export async function createOrganization(input: { ownerId: number, name: string, subscriptionTier: string, subscriptionStatus: string }) {
  const result = await db.insert(schema.organizations).values({
    ...input,
    subscriptionTier: input.subscriptionTier as any,
    subscriptionStatus: input.subscriptionStatus as any
  }).returning({ id: schema.organizations.id });
  return result[0].id;
}

export async function getOrganizationsByOwner(ownerId: number) {
  return db.query.organizations.findMany({
    where: eq(schema.organizations.ownerId, ownerId)
  });
}

export async function getOrganizationById(id: number) {
  return db.query.organizations.findFirst({
    where: eq(schema.organizations.id, id)
  });
}

// ============================================================================
// LEDGERS
// ============================================================================

export async function createLedger(input: any) {
    const result = await db.insert(schema.ledgers).values(input).returning({ id: schema.ledgers.id });
    return result[0].id;
}

export async function getLedgersByOrganization(organizationId: number) {
    return db.query.ledgers.findMany({
        where: eq(schema.ledgers.organizationId, organizationId)
    });
}

export async function getLedgerById(id: number) {
    return db.query.ledgers.findFirst({
        where: eq(schema.ledgers.id, id)
    });
}

// ============================================================================
// CUSTOMERS
// ============================================================================

export async function createCustomer(input: any) {
    const result = await db.insert(schema.customers).values(input).returning({ id: schema.customers.id });
    return result[0].id;
}

export async function getCustomersByLedger(ledgerId: number) {
    return db.query.customers.findMany({
        where: eq(schema.customers.ledgerId, ledgerId)
    });
}

export async function getCustomerById(id: number) {
    return db.query.customers.findFirst({
        where: eq(schema.customers.id, id)
    });
}

export async function updateCustomer(id: number, input: any) {
    const { id: _id, ledgerId: _lid, ...fields } = input;
    await db.update(schema.customers).set({ ...fields, updatedAt: new Date() }).where(eq(schema.customers.id, id));
}

export async function searchCustomers(ledgerId: number, query: string) {
    return db.query.customers.findMany({
        where: and(
            eq(schema.customers.ledgerId, ledgerId),
            like(schema.customers.name, `%${query}%`)
        )
    });
}

// ============================================================================
// JOBS
// ============================================================================

export async function createJob(input: any) {
    const result = await db.insert(schema.jobs).values(input).returning({ id: schema.jobs.id });
    return result[0].id;
}

export async function getJobsByLedger(ledgerId: number) {
    return db.query.jobs.findMany({
        where: eq(schema.jobs.ledgerId, ledgerId),
        orderBy: desc(schema.jobs.createdAt)
    });
}

export async function getJobById(id: number) {
    return db.query.jobs.findFirst({ where: eq(schema.jobs.id, id) });
}

export async function updateJob(id: number, input: any) {
    const { id: _id, ...fields } = input;
    await db.update(schema.jobs).set({ ...fields, updatedAt: new Date() }).where(eq(schema.jobs.id, id));
}

export async function createJobCost(input: any) {
    const result = await db.insert(schema.jobCosts).values(input).returning({ id: schema.jobCosts.id });
    return result[0].id;
}

export async function getJobCosts(jobId: number) {
    return db.query.jobCosts.findMany({ where: eq(schema.jobCosts.jobId, jobId) });
}

export async function deleteJobCost(id: number) {
    await db.delete(schema.jobCosts).where(eq(schema.jobCosts.id, id));
}

export async function getJobCostSummary(jobId: number) {
    const costs = await getJobCosts(jobId);
    return {
        totalCost: costs.reduce((sum, c) => sum + (c.totalCost || 0), 0),
        laborCost: costs.filter(c => c.type === 'labor').reduce((sum, c) => sum + (c.totalCost || 0), 0),
        partsCost: costs.filter(c => c.type === 'parts').reduce((sum, c) => sum + (c.totalCost || 0), 0),
        overheadCost: costs.filter(c => c.type === 'overhead').reduce((sum, c) => sum + (c.totalCost || 0), 0),
    };
}

// ============================================================================
// VEHICLES
// ============================================================================

export async function createVehicle(input: any) {
    const result = await db.insert(schema.vehicles).values(input).returning({ id: schema.vehicles.id });
    return result[0].id;
}

export async function getVehiclesByLedger(ledgerId: number) {
    return db.query.vehicles.findMany({ where: eq(schema.vehicles.ledgerId, ledgerId) });
}

export async function getVehicleById(id: number) {
    return db.query.vehicles.findFirst({ where: eq(schema.vehicles.id, id) });
}

// ============================================================================
// INVOICES
// ============================================================================

export async function createInvoice(input: any) {
    const {
        items,
        ledgerId,
        customerId,
        jobId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        subtotal,
        gstAmount,
        totalAmount,
        notes,
        status,
        paidDate,
        ..._rest
    } = input;

    const result = await db
        .insert(schema.invoices)
        .values({
            jobId,
            invoiceNumber,
            invoiceDate,
            dueDate,
            subtotal,
            gstAmount,
            totalAmount,
            notes,
            status,
            paidDate,
        })
        .returning({ id: schema.invoices.id });
    return result[0].id;
}

export async function getInvoicesByLedger(ledgerId: number) {
    const rows = await db
        .select({
            id: schema.invoices.id,
            jobId: schema.invoices.jobId,
            invoiceNumber: schema.invoices.invoiceNumber,
            invoiceDate: schema.invoices.invoiceDate,
            dueDate: schema.invoices.dueDate,
            subtotal: schema.invoices.subtotal,
            gstAmount: schema.invoices.gstAmount,
            totalAmount: schema.invoices.totalAmount,
            status: schema.invoices.status,
            paidDate: schema.invoices.paidDate,
            notes: schema.invoices.notes,
            createdAt: schema.invoices.createdAt,
            updatedAt: schema.invoices.updatedAt,
            ledgerId: schema.jobs.ledgerId,
            jobNumber: schema.jobs.jobNumber,
            jobDescription: schema.jobs.description,
            customerName: schema.jobs.customerName,
            customerEmail: schema.jobs.customerEmail,
            customerPhone: schema.jobs.customerPhone,
        })
        .from(schema.invoices)
        .innerJoin(schema.jobs, eq(schema.invoices.jobId, schema.jobs.id))
        .where(eq(schema.jobs.ledgerId, ledgerId))
        .orderBy(desc(schema.invoices.createdAt));

    return rows;
}

export async function getInvoiceById(id: number) {
    const inv = await db.query.invoices.findFirst({ where: eq(schema.invoices.id, id) });
    if (!inv) return null;
    const job = await getJobById(inv.jobId);
    return { ...inv, ledgerId: job?.ledgerId };
}

// ============================================================================
// BOOKINGS
// ============================================================================

export async function createBooking(input: any) {
    const ledgerId: number = input.ledgerId;
    const serviceType: string = input.serviceType;

    const bookingDate: Date = input.bookingDate instanceof Date ? input.bookingDate : new Date(input.bookingDate);
    const timeSlot: string = String(input.timeSlot || "09:00");

    const datePart = bookingDate.toISOString().split("T")[0];
    const scheduledDate = new Date(`${datePart}T${timeSlot}:00`);

    let service = await db.query.services.findFirst({
        where: and(eq(schema.services.ledgerId, ledgerId), eq(schema.services.name, serviceType)),
    });

    if (!service) {
        const [created] = await db
            .insert(schema.services)
            .values({
                ledgerId,
                name: serviceType,
                description: null,
                basePrice: 0,
                estimatedDuration: 60,
                active: true,
            })
            .returning();
        service = created;
    }

    const duration = Number.isFinite(Number(service.estimatedDuration)) ? Number(service.estimatedDuration) : 60;

    const [booking] = await db
        .insert(schema.bookings)
        .values({
            ledgerId,
            customerId: input.customerId,
            serviceId: service.id,
            scheduledDate,
            duration,
            status: "confirmed",
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            vehicleInfo: input.vehicleInfo,
            notes: input.notes,
        })
        .returning();

    return booking.id;
}

export async function getBookingsByLedger(ledgerId: number) {
    return db.query.bookings.findMany({ where: eq(schema.bookings.ledgerId, ledgerId) });
}

export async function getBookingById(id: number) {
    return db.query.bookings.findFirst({ where: eq(schema.bookings.id, id) });
}

// ============================================================================
// QUOTES
// ============================================================================

export async function createQuote(input: any) {
    const {
        items,
        vehicleInfo,  // not a quotes column — strip it
        ledgerId,
        customerId,
        quoteNumber,
        subtotal,
        gstAmount,
        totalAmount,
        expiryDate,
        notes,
        status,
        bookingId,
        jobId,
    } = input;

    const result = await db.insert(schema.quotes).values({
        ledgerId,
        customerId,
        quoteNumber,
        subtotal,
        gstAmount,
        totalAmount,
        expiryDate,
        notes,
        status,
        bookingId,
        jobId,
    }).returning({ id: schema.quotes.id });

    const quoteId = result[0].id;

    if (items && items.length) {
        await db.insert(schema.quoteItems).values(
            items.map((i: any) => ({
                quoteId,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                totalPrice: i.total ?? i.totalPrice ?? (i.quantity * i.unitPrice),
                itemType: i.itemType ?? "labor",
            }))
        );
    }
    return quoteId;
}

export async function getQuotesByLedger(ledgerId: number) {
    const rows = await db
        .select({
            id: schema.quotes.id,
            ledgerId: schema.quotes.ledgerId,
            bookingId: schema.quotes.bookingId,
            jobId: schema.quotes.jobId,
            quoteNumber: schema.quotes.quoteNumber,
            customerId: schema.quotes.customerId,
            subtotal: schema.quotes.subtotal,
            gstAmount: schema.quotes.gstAmount,
            totalAmount: schema.quotes.totalAmount,
            status: schema.quotes.status,
            expiryDate: schema.quotes.expiryDate,
            approvedDate: schema.quotes.approvedDate,
            notes: schema.quotes.notes,
            createdAt: schema.quotes.createdAt,
            updatedAt: schema.quotes.updatedAt,
            customerName: schema.customers.name,
            customerEmail: schema.customers.email,
            customerPhone: schema.customers.phone,
        })
        .from(schema.quotes)
        .innerJoin(schema.customers, eq(schema.quotes.customerId, schema.customers.id))
        .where(eq(schema.quotes.ledgerId, ledgerId))
        .orderBy(desc(schema.quotes.createdAt));

    return rows;
}

export async function getQuoteById(id: number) {
    const quote = await db.query.quotes.findFirst({ where: eq(schema.quotes.id, id) });
    if (!quote) return null;

    const items = await db.query.quoteItems.findMany({ where: eq(schema.quoteItems.quoteId, id) });
    const customer = quote.customerId
        ? await db.query.customers.findFirst({ where: eq(schema.customers.id, quote.customerId) })
        : null;

    return {
        ...quote,
        items,
        customerName: customer?.name || null,
        customerEmail: customer?.email || null,
        customerPhone: customer?.phone || null,
    };
}

export async function updateQuoteStatus(id: number, status: string) {
    await db.update(schema.quotes).set({ status: status as any }).where(eq(schema.quotes.id, id));
}

// ============================================================================
// DVI
// ============================================================================

// ============================================================================
// DVI (DIGITAL VEHICLE INSPECTION)
// ============================================================================

export async function getOrCreateDefaultDviTemplate(ledgerId: number) {
    let template = await db.query.dviTemplates.findFirst({
        where: eq(schema.dviTemplates.ledgerId, ledgerId)
    });

    if (!template) {
        const [newTemplate] = await db.insert(schema.dviTemplates).values({
            ledgerId,
            name: "Standard Visual Inspection",
            description: "Default standard vehicle health check",
            active: true
        }).returning();
        
        template = newTemplate;

        // Create default sections
        const sections = [
            "Brakes", "Tires", "Fluids", "Suspension", "Electrical", "Engine", "Body", "Other"
        ];

        for (let i = 0; i < sections.length; i++) {
            await db.insert(schema.dviSections).values({
                templateId: template.id,
                name: sections[i],
                order: i
            });
        }
    }

    return template;
}

export async function createFullDviInspection(input: {
    ledgerId: number,
    jobId: number,
    vehicleId: number,
    items: Array<{
        category: string,
        component: string,
        status: "green" | "amber" | "red",
        comment?: string,
        recommendedAction?: string,
        estimatedCost?: number,
        mediaKeys?: string[]
    }>
}) {
    const template = await getOrCreateDefaultDviTemplate(input.ledgerId);
    const sections = await db.query.dviSections.findMany({
        where: eq(schema.dviSections.templateId, template.id)
    });

    const shareToken = crypto.randomUUID();

    // Start transaction
    return await db.transaction(async (tx) => {
        const [inspection] = await tx.insert(schema.dviInspections).values({
            ledgerId: input.ledgerId,
            jobId: input.jobId,
            vehicleId: input.vehicleId,
            templateId: template.id,
            inspectionNumber: `DVI-${Date.now()}`,
            status: 'in_progress',
            shareToken,
        }).returning();

        for (const item of input.items) {
            const section = sections.find(s => s.name === item.category) || sections[sections.length - 1];
            
            const [createdItem] = await tx.insert(schema.dviItems).values({
                inspectionId: inspection.id,
                sectionId: section.id,
                itemName: item.component,
                status: item.status,
                comment: item.comment,
                recommendedAction: item.recommendedAction,
                estimatedCost: item.estimatedCost,
            }).returning();

            if (item.mediaKeys && item.mediaKeys.length > 0) {
                for (const key of item.mediaKeys) {
                    await tx.insert(schema.dviImages).values({
                        itemId: createdItem.id,
                        imageUrl: key, // Expecting relative key or full URL
                        imageKey: key
                    });
                }
            }
        }

        return { id: inspection.id, shareToken };
    });
}

export async function getDviInspectionsByLedger(ledgerId: number) {
    return db.query.dviInspections.findMany({
        where: eq(schema.dviInspections.ledgerId, ledgerId),
        orderBy: desc(schema.dviInspections.createdAt),
    });
}

export async function getDviInspectionById(id: number) {
    return db.query.dviInspections.findFirst({ 
        where: eq(schema.dviInspections.id, id),
        with: {
            items: {
                with: {
                    images: true
                }
            }
        } as any
    });
}

export async function completeDviInspection(id: number, shareToken?: string) {
    await db.update(schema.dviInspections).set({ 
        status: 'shared', 
        shareToken: shareToken || crypto.randomUUID(), 
        completedAt: new Date() 
    }).where(eq(schema.dviInspections.id, id));
}
// ============================================================================
// SETTINGS
// ============================================================================

export async function getInvoiceSettings(ledgerId: number) {
  return db.query.invoiceSettings.findFirst({
    where: eq(schema.invoiceSettings.ledgerId, ledgerId)
  });
}

export async function updateInvoiceSettings(ledgerId: number, input: any) {
  const existing = await getInvoiceSettings(ledgerId);
  if (existing) {
    await db.update(schema.invoiceSettings)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(schema.invoiceSettings.ledgerId, ledgerId));
    return existing.id;
  } else {
    const result = await db.insert(schema.invoiceSettings).values({ ...input, ledgerId }).returning({ id: schema.invoiceSettings.id });
    return result[0].id;
  }
}

// ============================================================================
// INVENTORY & SUPPLIERS
// ============================================================================

export async function getPartsByLedger(ledgerId: number) {
    return db.query.parts.findMany({
        where: eq(schema.parts.ledgerId, ledgerId)
    });
}

export async function createPart(input: any) {
    const result = await db.insert(schema.parts).values({
        ...input,
        updatedAt: new Date()
    }).returning({ id: schema.parts.id });
    return result[0].id;
}

export async function updatePart(id: number, input: any) {
    const { id: _id, ledgerId: _lid, ...fields } = input;
    await db.update(schema.parts).set({ ...fields, updatedAt: new Date() }).where(eq(schema.parts.id, id));
}

export async function getSuppliersByLedger(ledgerId: number) {
    return db.query.suppliers.findMany({
        where: eq(schema.suppliers.ledgerId, ledgerId)
    });
}

export async function createSupplier(input: any) {
    const result = await db.insert(schema.suppliers).values({
        ...input,
        updatedAt: new Date()
    }).returning({ id: schema.suppliers.id });
    return result[0].id;
}

export async function recordStockMovement(input: any) {
    const { partId, ledgerId, quantity, movementType, notes, createdBy } = input;
    
    return await db.transaction(async (tx) => {
        const [movement] = await tx.insert(schema.stockMovements).values({
            ledgerId,
            partId,
            movementType,
            quantity,
            notes,
            createdBy,
        }).returning();

        const part = await tx.query.parts.findFirst({
            where: eq(schema.parts.id, partId)
        });

        if (part) {
            await tx.update(schema.parts).set({ 
                stockQuantity: (part.stockQuantity || 0) + quantity,
                updatedAt: new Date()
            }).where(eq(schema.parts.id, partId));
        }

        return movement;
    });
}

export async function getStockMovements(ledgerId: number, partId?: number) {
    const conditions = [eq(schema.stockMovements.ledgerId, ledgerId)];
    if (partId) {
        conditions.push(eq(schema.stockMovements.partId, partId));
    }
    
    return db.query.stockMovements.findMany({
        where: and(...conditions),
        orderBy: desc(schema.stockMovements.createdAt)
    });
}

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

export async function getDashboardStats(ledgerId: number) {
    const [jobs, invoices, allParts] = await Promise.all([
        db.query.jobs.findMany({ where: eq(schema.jobs.ledgerId, ledgerId) }),
        getInvoicesByLedger(ledgerId),
        db.query.parts.findMany({ where: eq(schema.parts.ledgerId, ledgerId) })
    ]);

    const activeOperations = jobs.filter(j => j.status === 'IN_PROGRESS').length;
    const pendingQuotes = jobs.filter(j => j.status === 'WAITING_APPROVAL').length;
    const lowStockItems = allParts.filter(p => (p.stockQuantity || 0) <= (p.minStockLevel || 0)).length;
    
    // Revenue last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyRevenue = invoices
        .filter(inv => new Date(inv.createdAt) >= thirtyDaysAgo)
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    return {
        activeOperations,
        pendingQuotes,
        lowStockItems,
        monthlyRevenue,
        activeAssets: allParts.length,
    };
}

export async function getAutonomousActions(ledgerId: number) {
    return db.query.autonomousActions.findMany({
        where: eq(schema.autonomousActions.ledgerId, ledgerId),
        orderBy: desc(schema.autonomousActions.createdAt),
        limit: 10
    });
}


