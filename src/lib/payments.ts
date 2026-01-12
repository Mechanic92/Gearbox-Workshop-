import Stripe from 'stripe';

/**
 * Stripe Payment Controller
 * Handles secure invoice payments and subscription billing
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock');

/**
 * Create a Stripe Payment Intent for an invoice
 */
export async function createPaymentIntent(invoiceId: number, amount: number, currency: string = 'nzd') {
  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency,
    metadata: { invoiceId: invoiceId.toString() },
    payment_method_types: ['card'],
  });

  return {
    clientSecret: intent.client_secret,
    id: intent.id,
  };
}

/**
 * Create a Checkout Session for the customer portal
 */
export async function createCheckoutSession(params: {
  amount: number;
  currency: string;
  invoiceId: number;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: params.currency,
          product_data: {
            name: `Invoice #${params.invoiceId}`,
            description: 'Vehicle Service/Repair Payment',
          },
          unit_amount: Math.round(params.amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { invoiceId: params.invoiceId.toString() },
  });

  return { url: session.url };
}

/**
 * Handle Stripe Webhooks
 */
export async function handleStripeWebhook(payload: string, signature: string) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err: any) {
    throw new Error(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;
    
    if (invoiceId) {
      // Logic to mark invoice as paid in DB
      return { status: 'paid', invoiceId };
    }
  }

  return { status: 'ignored' };
}
