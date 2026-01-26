import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from './schema';
import { eq, and, like, desc, sql } from "drizzle-orm";

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
    await db.update(schema.customers).set(input).where(eq(schema.customers.id, id));
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
    await db.update(schema.jobs).set(input).where(eq(schema.jobs.id, id));
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
    const { items, ...invoiceData } = input;
    const result = await db.insert(schema.invoices).values(invoiceData).returning({ id: schema.invoices.id });
    return result[0].id;
}

export async function getInvoicesByLedger(ledgerId: number) {
    return []; // Placeholder
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
    const result = await db.insert(schema.bookings).values(input).returning({ id: schema.bookings.id });
    return result[0].id;
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
    const { items, ...data } = input;
    const result = await db.insert(schema.quotes).values(data).returning({ id: schema.quotes.id });
    const quoteId = result[0].id;
    if (items && items.length) {
        await db.insert(schema.quoteItems).values(items.map((i: any) => ({ ...i, quoteId })));
    }
    return quoteId;
}

export async function getQuotesByLedger(ledgerId: number) {
    return db.query.quotes.findMany({ where: eq(schema.quotes.ledgerId, ledgerId) });
}

export async function getQuoteById(id: number) {
    const quote = await db.query.quotes.findFirst({ where: eq(schema.quotes.id, id), with: { items: true } as any });
    return quote as any; 
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
