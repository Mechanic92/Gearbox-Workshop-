import Stripe from 'stripe';
import { db } from './db';
import { subscriptions, billingHistory, subscriptionUsage, organizations } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Stripe Subscription Management
 * Handles SaaS subscription billing for Gearbox Fintech
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2023-10-16' as any,
});

// Stripe Price IDs - These need to be created in Stripe Dashboard
export const STRIPE_PRICES = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  },
  professional: {
    monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
    yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_professional_yearly',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },
};

/**
 * Create a Stripe checkout session for subscription signup
 */
export async function createSubscriptionCheckout(params: {
  organizationId: number;
  tier: 'starter' | 'professional' | 'enterprise';
  billingPeriod: 'monthly' | 'yearly';
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}) {
  const priceId = STRIPE_PRICES[params.tier][params.billingPeriod];

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      organizationId: params.organizationId.toString(),
      tier: params.tier,
    },
    subscription_data: {
      trial_period_days: params.trialDays || 14,
      metadata: {
        organizationId: params.organizationId.toString(),
        tier: params.tier,
      },
    },
    allow_promotion_codes: true,
  });

  return { url: session.url, sessionId: session.id };
}

/**
 * Create a billing portal session for subscription management
 */
export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl,
  });

  return { url: session.url };
}

/**
 * Handle subscription created webhook
 */
export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const organizationId = parseInt(subscription.metadata.organizationId || '0');
  if (!organizationId) {
    throw new Error('Organization ID not found in subscription metadata');
  }

  const tier = subscription.metadata.tier as 'starter' | 'professional' | 'enterprise';

  // Create subscription record
  await db.insert(subscriptions).values({
    organizationId,
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0].price.id,
    status: subscription.status as any,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  });

  // Update organization subscription status
  await db.update(organizations)
    .set({
      subscriptionTier: tier,
      subscriptionStatus: subscription.status === 'trialing' ? 'active' : subscription.status as any,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  // Initialize usage tracking for current period
  await db.insert(subscriptionUsage).values({
    organizationId,
    billingPeriodStart: new Date((subscription as any).current_period_start * 1000),
    billingPeriodEnd: new Date((subscription as any).current_period_end * 1000),
    jobsCreated: 0,
    storageUsedMb: 0,
    activeUsers: 1,
    apiCalls: 0,
  });

  return { success: true };
}

/**
 * Handle subscription updated webhook
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = parseInt(subscription.metadata.organizationId || '0');
  if (!organizationId) return { success: false, error: 'No organization ID' };

  // Update subscription record
  await db.update(subscriptions)
    .set({
      status: subscription.status as any,
      currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      stripePriceId: subscription.items.data[0].price.id,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, organizationId));

  // Update organization status
  await db.update(organizations)
    .set({
      subscriptionStatus: subscription.status as any,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  return { success: true };
}

/**
 * Handle subscription deleted/cancelled webhook
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const organizationId = parseInt(subscription.metadata.organizationId || '0');
  if (!organizationId) return { success: false, error: 'No organization ID' };

  // Update subscription status
  await db.update(subscriptions)
    .set({
      status: 'canceled',
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.organizationId, organizationId));

  // Suspend organization access
  await db.update(organizations)
    .set({
      subscriptionStatus: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, organizationId));

  return { success: true };
}

/**
 * Handle invoice paid webhook
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return { success: false };

  // Find organization by subscription ID
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!sub) return { success: false, error: 'Subscription not found' };

  // Record billing history
  await db.insert(billingHistory).values({
    organizationId: sub.organizationId,
    stripeInvoiceId: invoice.id,
    amount: invoice.amount_paid / 100, // Convert from cents
    currency: invoice.currency,
    status: invoice.status as any,
    invoiceUrl: invoice.hosted_invoice_url || null,
    paidAt: (invoice.status_transitions as any)?.paid_at ? new Date((invoice.status_transitions as any).paid_at * 1000) : null,
  });

  return { success: true };
}

/**
 * Handle invoice payment failed webhook
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return { success: false };

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, subscriptionId),
  });

  if (!sub) return { success: false };

  // Update organization to past_due status
  await db.update(organizations)
    .set({
      subscriptionStatus: 'suspended',
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, sub.organizationId));

  // TODO: Send notification email to customer

  return { success: true };
}

/**
 * Main webhook handler for Stripe subscription events
 */
export async function handleSubscriptionWebhook(payload: string, signature: string) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    throw new Error(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event.data.object as Stripe.Subscription);
    
    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    
    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    
    case 'invoice.paid':
      return handleInvoicePaid(event.data.object as Stripe.Invoice);
    
    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
    
    default:
      return { status: 'ignored', type: event.type };
  }
}

/**
 * Get subscription status for an organization
 */
export async function getSubscriptionStatus(organizationId: number) {
  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, organizationId),
  });

  if (!subscription) {
    return null;
  }

  const usage = await db.query.subscriptionUsage.findFirst({
    where: eq(subscriptionUsage.organizationId, organizationId),
    orderBy: (usage, { desc }) => [desc(usage.billingPeriodStart)],
  });

  return {
    subscription,
    usage,
  };
}
