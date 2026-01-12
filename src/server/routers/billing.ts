import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
  createSubscriptionCheckout,
  createBillingPortalSession,
  getSubscriptionStatus,
} from '../../lib/stripe-subscriptions';
import { getCurrentUsage, TIER_LIMITS } from '../../lib/feature-gates';
import * as db from '../../lib/db';

/**
 * Billing & Subscription Management Router
 */
export const billingRouter = router({
  /**
   * Create a checkout session for new subscription
   */
  createCheckout: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
      tier: z.enum(['starter', 'professional', 'enterprise']),
      billingPeriod: z.enum(['monthly', 'yearly']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns organization
      const org = await db.getOrganizationById(input.organizationId);
      if (!org || org.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const user = ctx.user;
      const successUrl = `${process.env.APP_URL}/dashboard?subscription=success`;
      const cancelUrl = `${process.env.APP_URL}/pricing?subscription=cancelled`;

      const result = await createSubscriptionCheckout({
        organizationId: input.organizationId,
        tier: input.tier,
        billingPeriod: input.billingPeriod,
        customerEmail: user.email || '',
        successUrl,
        cancelUrl,
        trialDays: 14,
      });

      return result;
    }),

  /**
   * Create billing portal session for subscription management
   */
  createPortalSession: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user owns organization
      const org = await db.getOrganizationById(input.organizationId);
      if (!org || org.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      // Get subscription
      const subscription = await getSubscriptionStatus(input.organizationId);
      if (!subscription?.subscription) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No active subscription' });
      }

      const returnUrl = `${process.env.APP_URL}/settings/billing`;

      const result = await createBillingPortalSession({
        stripeCustomerId: subscription.subscription.stripeCustomerId,
        returnUrl,
      });

      return result;
    }),

  /**
   * Get current subscription status and usage
   */
  getStatus: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user has access to organization
      const org = await db.getOrganizationById(input.organizationId);
      if (!org) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      const hasAccess = await db.verifyOrganizationAccess(ctx.user.id, input.organizationId);
      if (!hasAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const subscription = await getSubscriptionStatus(input.organizationId);
      const usage = await getCurrentUsage(input.organizationId);

      return {
        organization: org,
        subscription: subscription?.subscription || null,
        usage,
      };
    }),

  /**
   * Get available subscription plans
   */
  getPlans: protectedProcedure.query(async () => {
    return {
      starter: {
        tier: 'starter',
        name: 'Starter',
        priceMonthly: 29.99,
        priceYearly: 299,
        currency: 'NZD',
        limits: TIER_LIMITS.starter,
        features: [
          'Up to 2 users',
          '50 jobs per month',
          'Digital vehicle inspections',
          'Invoice generation',
          'Stripe payments',
          'Mobile technician app',
          '5GB storage',
          'Email notifications',
        ],
      },
      professional: {
        tier: 'professional',
        name: 'Professional',
        priceMonthly: 69.99,
        priceYearly: 699,
        currency: 'NZD',
        popular: true,
        limits: TIER_LIMITS.professional,
        features: [
          'Up to 10 users',
          'Unlimited jobs',
          'Everything in Starter, plus:',
          'Xero integration',
          'Advanced reporting',
          'Inventory management',
          'SMS notifications',
          'Custom branding',
          '50GB storage',
          'Priority support',
        ],
      },
      enterprise: {
        tier: 'enterprise',
        name: 'Enterprise',
        priceMonthly: 99.99,
        priceYearly: 999,
        currency: 'NZD',
        limits: TIER_LIMITS.enterprise,
        features: [
          'Unlimited users',
          'Unlimited jobs',
          'Everything in Professional, plus:',
          'Up to 5 locations',
          'Multi-location reporting',
          'Advanced inventory',
          'API access',
          'White-label options',
          '200GB storage',
          'Dedicated account manager',
          'Phone support',
        ],
      },
    };
  }),

  /**
   * Get billing history
   */
  getBillingHistory: protectedProcedure
    .input(z.object({
      organizationId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify user owns organization
      const org = await db.getOrganizationById(input.organizationId);
      if (!org || org.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      const history = await db.db.query.billingHistory.findMany({
        where: (billingHistory, { eq }) => eq(billingHistory.organizationId, input.organizationId),
        orderBy: (billingHistory, { desc }) => [desc(billingHistory.createdAt)],
        limit: 12, // Last 12 invoices
      });

      return history;
    }),
});
