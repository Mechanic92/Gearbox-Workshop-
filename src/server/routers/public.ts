import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { calculateAvailability } from '@/lib/availability';
import { sendSMS } from '@/lib/notifications/sms';
import { sendEmail } from '@/lib/notifications/email';
import { sendMagicLink, validateMagicLink } from '@/lib/auth/magic-link';
import { createCheckoutSession } from '@/lib/payments';
import { v4 as uuidv4 } from 'uuid';

/**
 * Public API Router
 * 
 * These endpoints are accessible without authentication.
 * Used for:
 * - Website booking widget
 * - Customer DVI approval
 * - Webhook receivers (Xero, Stripe, etc.)
 */

const t = initTRPC.create();

export const publicRouter = t.router({
  // Get available time slots for booking
  availability: t.procedure
    .input(
      z.object({
        shopId: z.string(),
        date: z.string(), // ISO date string
        serviceType: z.string(),
        serviceDuration: z.number().optional().default(60),
      })
    )
    .query(async ({ input }) => {
      const ledgerId = parseInt(input.shopId, 10);
      const date = new Date(input.date);

      const slots = await calculateAvailability(
        {
          ledgerId,
          date,
          serviceType: input.serviceType,
          serviceDuration: input.serviceDuration,
        },
        db
      );

      return {
        date: input.date,
        slots: slots.filter((s) => s.available).map((s) => s.time),
      };
    }),

  // Create a new booking from website widget
  createBooking: t.procedure
    .input(
      z.object({
        shopId: z.string(),
        customerName: z.string().min(2),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().min(10),
        vehicleRegistration: z.string().optional(),
        vehicleMake: z.string().optional(),
        vehicleModel: z.string().optional(),
        serviceType: z.string(),
        preferredDate: z.string(), // ISO date
        preferredTime: z.string(), // HH:MM
        notes: z.string().optional(),
        captchaToken: z.string(), // hCaptcha or reCAPTCHA token
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Verify CAPTCHA token
      // const captchaValid = await verifyCaptcha(input.captchaToken);
      // if (!captchaValid) throw new Error('Invalid CAPTCHA');

      const ledgerId = parseInt(input.shopId, 10);

      // Insert booking into database
      const [booking] = await db.insert(schema.bookings).values({
        ledgerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        vehicleInfo: JSON.stringify({
          registration: input.vehicleRegistration,
          make: input.vehicleMake,
          model: input.vehicleModel
        }),
        serviceId: 1, // Default or lookup
        scheduledDate: new Date(`${input.preferredDate}T${input.preferredTime}:00`),
        duration: 60,
        notes: input.notes,
        status: 'pending'
      }).returning();

      const bookingId = booking.id;

      // Get ledger info
      const ledger = await db.query.ledgers.findFirst({
        where: eq(schema.ledgers.id, ledgerId)
      });

      const shopName = ledger?.name || 'Gearbox Workshop';

      // Send confirmation SMS
      if (input.customerPhone) {
        await sendSMS(input.customerPhone, {
          type: 'booking_confirmation',
          variables: {
            customerName: input.customerName,
            shopName,
            date: new Date(input.preferredDate).toLocaleDateString(),
            time: input.preferredTime,
            service: input.serviceType,
          },
        });
      }

      // Send confirmation email
      if (input.customerEmail) {
        await sendEmail(input.customerEmail, {
          type: 'booking_confirmation',
          variables: {
            customerName: input.customerName,
            shopName,
            date: new Date(input.preferredDate).toLocaleDateString(),
            time: input.preferredTime,
            service: input.serviceType,
            vehicleRego: input.vehicleRegistration || '',
          },
        });
      }

      // Update confirmation sent timestamp
      // await db.update(schema.bookings).set({ confirmationSentAt: new Date() }).where(eq(schema.bookings.id, bookingId));

      return {
        success: true,
        bookingId: Number(bookingId),
        message: 'Booking confirmed! Check your phone/email for details.',
      };
    }),

  // Get DVI details for customer approval (public, token-based)
  getDVI: t.procedure
    .input(
      z.object({
        token: z.string().uuid(),
      })
    )
    .query(async ({ input }) => {
      const inspection = await db.query.dviInspections.findFirst({
        where: eq(schema.dviInspections.shareToken, input.token),
      });

      if (!inspection) {
        throw new Error('Inspection not found or link expired');
      }

      // Get job, vehicle and customer
      const job: any = await db.query.jobs.findFirst({
        where: eq(schema.jobs.id, inspection.jobId!),
        with: {
          vehicle: true,
          customer: true
        }
      });

      // Get items with images
      const items = await db.query.dviItems.findMany({
        where: eq(schema.dviItems.inspectionId, inspection.id),
        orderBy: (items, { asc }) => [asc(items.id)]
      });

      const itemsWithMedia = await Promise.all(items.map(async (item) => {
        const media = await db.query.dviImages.findMany({
          where: eq(schema.dviImages.itemId, item.id)
        });
        
        return {
          ...item,
          media: media.map(m => ({
            id: m.id,
            type: m.imageKey.endsWith('.mp4') ? 'video' : 'photo',
            imageUrl: m.imageUrl, // In production, wrap this in a presigned URL if bucket is private
            imageKey: m.imageKey
          }))
        };
      }));

      return {
        inspection: {
          id: inspection.id,
          inspectionDate: inspection.createdAt,
          vehicleRego: job?.vehicle?.licensePlate || 'Unknown',
          customerName: job?.customer?.name || 'Customer',
          status: inspection.status,
        },
        items: itemsWithMedia,
      };
    }),

  // Submit DVI approval
  approveDVI: t.procedure
    .input(
      z.object({
        token: z.string().uuid(),
        approvedItems: z.array(z.number()), // Array of inspection_item IDs
        signature: z.string(), // Base64 encoded signature
      })
    )
    .mutation(async ({ input }) => {
      const inspection = await db.query.dviInspections.findFirst({
        where: eq(schema.dviInspections.shareToken, input.token)
      });

      if (!inspection) {
        throw new Error('Inspection not found or link expired');
      }

      // Update approved items
      for (const itemId of input.approvedItems) {
        await db.update(schema.dviItems)
          .set({ status: 'green' }) // Or a specific 'approved' status
          .where(eq(schema.dviItems.id, itemId));
      }

      // Update inspection status
      await db.update(schema.dviInspections)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(schema.dviInspections.id, inspection.id));

      return {
        success: true,
        message: 'Thank you! Your approval has been recorded.',
      };
    }),

  // Request a magic link for login
  requestMagicLink: t.procedure
    .input(z.object({ email: z.string().email().optional(), phone: z.string().optional() }))
    .mutation(async ({ input }) => {
      // Find customer by email or phone
      // const customer = await db.query.customers.findFirst(...);
      return await sendMagicLink({ 
        email: input.email, 
        phone: input.phone, 
        customerId: 1, 
        ledgerId: 1 
      });
    }),

  // Validate magic link
  verifyMagicLink: t.procedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      return await validateMagicLink(input.token);
    }),

  // Create payment checkout session
  createPaymentSession: t.procedure
    .input(z.object({ invoiceId: z.number(), customerId: z.number() }))
    .mutation(async ({ input }) => {
      // Get invoice details
      const invoice = await db.query.invoices.findFirst({ where: eq(schema.invoices.id, input.invoiceId) });
      if (!invoice) throw new Error('Invoice not found');
      
      return await createCheckoutSession({
        amount: invoice.totalAmount,
        currency: 'nzd',
        invoiceId: invoice.id,
        customerEmail: 'customer@example.com', // Get from DB
        successUrl: `https://gearbox.app/portal/billing?success=true`,
        cancelUrl: `https://gearbox.app/portal/billing?cancel=true`,
      });
    }),
});

export type PublicRouter = typeof publicRouter;
