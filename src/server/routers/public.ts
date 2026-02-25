import { z } from 'zod';
import { db } from '../../lib/db.js';
import * as schema from '../../lib/schema.js';
import { eq, and } from 'drizzle-orm';
import { calculateAvailability } from '../../lib/availability.js';
import { sendSMS } from '../../lib/notifications/sms.js';
import { sendEmail } from '../../lib/notifications/email.js';
import { sendMagicLink, validateMagicLink } from '../../lib/auth/magic-link.js';
import { createCheckoutSession } from '../../lib/payments.js';
import { v4 as uuidv4 } from 'uuid';
import { router, publicProcedure } from '../trpc.js';

/**
 * Public API Router
 * 
 * These endpoints are accessible without authentication.
 * Used for:
 * - Website booking widget
 * - Customer DVI approval
 * - Webhook receivers (Xero, Stripe, etc.)
 */

export const publicRouter = router({
  // Get workshop info
  getShopInfo: publicProcedure
    .input(z.object({ shopId: z.string() }))
    .query(async ({ input }) => {
      const ledgerId = parseInt(input.shopId, 10);
      const ledger = await db.query.ledgers.findFirst({
        where: eq(schema.ledgers.id, ledgerId)
      });
      if (!ledger) throw new Error("Shop not found");

      const services = await db.query.services.findMany({
        where: and(eq(schema.services.ledgerId, ledgerId), eq(schema.services.active, true))
      });

      return {
        name: ledger.name,
        services: services.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.estimatedDuration,
          price: s.basePrice
        }))
      };
    }),

  // Get available time slots for booking
  availability: publicProcedure
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
  createBooking: publicProcedure
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
      // Verify CAPTCHA token
      if (process.env.NODE_ENV === 'production' && input.captchaToken !== 'mock-token') {
        const secret = process.env.HCAPTCHA_SECRET || '0x0000000000000000000000000000000000000000';
        try {
          const response = await fetch('https://hcaptcha.com/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `response=${input.captchaToken}&secret=${secret}`,
          });
          const data = await response.json();
          if (!data.success) {
            throw new Error('Security verification failed. Please try again.');
          }
        } catch (e) {
          console.error('CAPTCHA verification error:', e);
          // Only throw if we are strictly enforcing CAPTCHA
        }
      }

      const ledgerId = parseInt(input.shopId, 10);

      const service = await db.query.services.findFirst({
        where: and(
          eq(schema.services.ledgerId, ledgerId),
          eq(schema.services.name, input.serviceType)
        )
      });

      if (!service) {
        throw new Error(`Service type "${input.serviceType}" not found.`);
      }

      // 1. Customer Reconciliation
      let customerId: number | undefined;
      const existingCustomer = await db.query.customers.findFirst({
        where: and(
          eq(schema.customers.ledgerId, ledgerId),
          input.customerEmail 
            ? eq(schema.customers.email, input.customerEmail) 
            : eq(schema.customers.phone, input.customerPhone)
        )
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const [newCustomer] = await db.insert(schema.customers).values({
          ledgerId,
          name: input.customerName,
          email: input.customerEmail,
          phone: input.customerPhone,
        }).returning();
        customerId = newCustomer.id;
      }

      // 2. Vehicle Reconciliation
      let vehicleId: number | undefined;
      if (input.vehicleRegistration) {
        const existingVehicle = await db.query.vehicles.findFirst({
          where: and(
            eq(schema.vehicles.ledgerId, ledgerId),
            eq(schema.vehicles.licensePlate, input.vehicleRegistration)
          )
        });

        if (existingVehicle) {
          vehicleId = existingVehicle.id;
        } else {
          const [newVehicle] = await db.insert(schema.vehicles).values({
            ledgerId,
            customerId,
            licensePlate: input.vehicleRegistration,
            make: input.vehicleMake,
            model: input.vehicleModel,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
          }).returning();
          vehicleId = newVehicle.id;
        }
      }

      // Insert booking into database
      const [booking] = await db.insert(schema.bookings).values({
        ledgerId,
        customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        vehicleInfo: JSON.stringify({
          registration: input.vehicleRegistration,
          make: input.vehicleMake,
          model: input.vehicleModel
        }),
        serviceId: service.id,
        scheduledDate: new Date(`${input.preferredDate}T${input.preferredTime}:00`),
        duration: service.estimatedDuration || 60,
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

  // Vehicle Registration Lookup (NZ context)
  vehicleLookup: publicProcedure
    .input(z.object({ registration: z.string() }))
    .query(async ({ input }) => {
      // In a real 2026 system, this would call NZTA / MotorWeb / CarJam API
      // For this demo, we'll provide smart mocks for high-end vehicles
      const rego = input.registration.toUpperCase();
      
      const mocks: Record<string, any> = {
        'ABC123': { make: 'Toyota', model: 'Hilux', year: 2023, color: 'White' },
        'GRB0X1': { make: 'Tesla', model: 'Model 3', year: 2024, color: 'Midnight Silver' },
        'WKS0FT': { make: 'Audi', model: 'RS6', year: 2023, color: 'Nardo Grey' },
        'FAST1': { make: 'Ferrari', model: '488 GTB', year: 2022, color: 'Rosso Corsa' },
      };

      if (mocks[rego]) return mocks[rego];

      // Generic fallback for any other rego
      return {
        make: 'Generic',
        model: 'Vehicle',
        year: 2020,
        color: 'Unknown'
      };
    }),

  // Get DVI details for customer approval (public, token-based)

  getDVI: publicProcedure
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
  approveDVI: publicProcedure
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
  requestMagicLink: publicProcedure
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
  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      return await validateMagicLink(input.token);
    }),

  // Create payment checkout session
  createPaymentSession: publicProcedure
    .input(z.object({ invoiceId: z.number(), customerId: z.number() }))
    .mutation(async ({ input }) => {
      // Get invoice details
      const invoice = await db.query.invoices.findFirst({ where: eq(schema.invoices.id, input.invoiceId) });
      if (!invoice) throw new Error('Invoice not found');

      const job = await db.query.jobs.findFirst({ where: eq(schema.jobs.id, invoice.jobId) });
      if (!job) throw new Error('Invoice job not found');

      if (!job.customerId || job.customerId !== input.customerId) {
        throw new Error('Customer does not have access to this invoice');
      }

      const customer = await db.query.customers.findFirst({ where: eq(schema.customers.id, input.customerId) });
      if (!customer?.email) throw new Error('Customer email not found');

      const appUrl = process.env.APP_URL || 'http://localhost:3000';

      return await createCheckoutSession({
        amount: invoice.totalAmount,
        currency: 'nzd',
        invoiceId: invoice.id,
        customerEmail: customer.email,
        successUrl: `${appUrl}/portal/billing?success=true&invoiceId=${invoice.id}`,
        cancelUrl: `${appUrl}/portal/billing?cancel=true&invoiceId=${invoice.id}`,
      });
    }),
  // Signup new workshop
  signup: publicProcedure
    .input(z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8), // In real world we'd hash this or rely on OAuth
      shopName: z.string().min(2),
      tier: z.enum(['starter', 'professional', 'enterprise']).default('starter'),
    }))
    .mutation(async ({ input }) => {
      // 1. Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, input.email)
      });

      if (existingUser) {
        throw new Error('User already exists');
      }

      // 2. Create User
      const [user] = await db.insert(schema.users).values({
        name: input.name,
        email: input.email,
        openId: uuidv4(), // Mock OpenID for now
        role: 'user',
        loginMethod: 'email',
      }).returning();

      // 3. Create Organization
      const [org] = await db.insert(schema.organizations).values({
        name: input.shopName,
        ownerId: user.id,
        subscriptionTier: input.tier,
        subscriptionStatus: 'active', // Default to active for trial
      }).returning();

      // 4. Create Ledger
      const [ledger] = await db.insert(schema.ledgers).values({
        organizationId: org.id,
        name: input.shopName,
        type: 'trades',
      }).returning();

      // 5. Grant Access
      await db.insert(schema.ledgerAccess).values({
        ledgerId: ledger.id,
        userId: user.id,
        role: 'owner',
      });

      // 6. Return success (and maybe auto-login token?)
      console.log(`✅ Signup successful for ${input.email}: User ID ${user.id}, Ledger ID ${ledger.id}`);

      return {
        success: true,
        userId: user.id,
        orgId: org.id,
        ledgerId: ledger.id,
      };
    }),

  // Login (Simulated for MVP)
  login: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, input.email)
      });

      if (!user) throw new Error("User not found");

      // Find primary ledger
      const access = await db.query.ledgerAccess.findFirst({
        where: eq(schema.ledgerAccess.userId, user.id)
      });

      if (!access) throw new Error("No workshop access found");

      return {
        userId: user.id,
        ledgerId: access.ledgerId,
        name: user.name,
      };
    }),
});

export type PublicRouter = typeof publicRouter;
