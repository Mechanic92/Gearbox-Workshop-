import { Request, Response } from 'express';
import { db } from '../lib/db';
import * as schema from '../lib/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../lib/notifications/email';

/**
 * SECTION 2 — PUBLIC INGESTION API
 * POST /api/public/bookings/ingest
 */
export async function handlePublicIngestion(req: Request, res: Response) {
  try {
    const { 
        shopId, 
        customer, 
        vehicle, 
        booking,
        payment,
        quoteSnapshot
    } = req.body;

    if (!shopId) return res.status(400).json({ error: "Missing shopId" });

    const ledgerId = parseInt(shopId, 10);
    
    // 1. Reconcile Customer
    let customerId: number;
    const existingCustomer = await db.query.customers.findFirst({
        where: and(
            eq(schema.customers.ledgerId, ledgerId),
            eq(schema.customers.email, customer.email)
        )
    });

    if (existingCustomer) {
        customerId = existingCustomer.id;
    } else {
        const [newCustomer] = await db.insert(schema.customers).values({
            ledgerId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            mobile: customer.mobile,
            address: customer.address,
        }).returning();
        customerId = newCustomer.id;
    }

    // 2. Reconcile Vehicle
    let vehicleId: number;
    const existingVehicle = await db.query.vehicles.findFirst({
        where: and(
            eq(schema.vehicles.ledgerId, ledgerId),
            eq(schema.vehicles.licensePlate, vehicle.licensePlate)
        )
    });

    if (existingVehicle) {
        vehicleId = existingVehicle.id;
    } else {
        const [newVehicle] = await db.insert(schema.vehicles).values({
            ledgerId,
            customerId,
            licensePlate: vehicle.licensePlate,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            vin: vehicle.vin,
            notes: JSON.stringify(vehicle.snapshot || {}),
        }).returning();
        vehicleId = newVehicle.id;
    }

    // 3. Create Job
    const [job] = await db.insert(schema.jobs).values({
        ledgerId,
        customerId,
        vehicleId,
        jobNumber: `GB-${Date.now().toString().slice(-6)}`,
        description: booking.serviceType || "Web Booking",
        status: "NEW",
        quotedPrice: booking.quotedPrice || 0,
        notes: quoteSnapshot ? `Quote Snapshot: ${JSON.stringify(quoteSnapshot)}` : undefined,
    }).returning();

    // 4. Create Booking
    const [gbBooking] = await db.insert(schema.bookings).values({
        ledgerId,
        customerId,
        serviceId: booking.serviceId || 1, // Default service
        scheduledDate: new Date(booking.date),
        duration: booking.duration || 60,
        status: "pending",
        customerName: customer.name,
        customerPhone: customer.phone,
        vehicleInfo: JSON.stringify(vehicle),
    }).returning();

    // 5. Create Payment Record (optional metadata on job for now)
    if (payment) {
        await db.update(schema.jobs).set({
            notes: (job.notes || '') + `\nPayment Snapshot: ${JSON.stringify(payment)}`
        }).where(eq(schema.jobs.id, job.id));
    }

    // SECTION 10 — Audit Log
    await db.insert(schema.auditLogs).values({
        ledgerId,
        action: "PUBLIC_INGESTION",
        entityType: "job",
        entityId: job.id,
        metadata: JSON.stringify({ bookingId: gbBooking.id, origin: req.ip }),
    });

    // 6. Send Confirmation Email
    const ledger = await db.query.ledgers.findFirst({
        where: eq(schema.ledgers.id, ledgerId)
    });
    
    if (customer.email) {
        await sendEmail(customer.email, {
            type: 'booking_confirmation',
            variables: {
                customerName: customer.name,
                shopName: ledger?.name || 'Gearbox Workshop',
                date: new Date(booking.date).toLocaleDateString(),
                time: new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                service: booking.serviceType || 'Automotive Service',
                vehicleRego: vehicle.licensePlate || '',
            }
        });
    }

    return res.status(201).json({
        gearbox_job_id: job.id,
        gearbox_booking_id: gbBooking.id,
        status: "success"
    });

  } catch (err: any) {
    console.error("Ingestion Error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}
