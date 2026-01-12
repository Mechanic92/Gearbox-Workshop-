import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers';
import { createContext } from './trpc';
import { handleStripeWebhook } from '../lib/payments';
import { handleSubscriptionWebhook } from '../lib/stripe-subscriptions';
import { handleXeroWebhook } from '../lib/integrations/xero-client';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '0.0.0.0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

// Webhook endpoints must be defined BEFORE express.json() to get raw body
// Stripe subscription webhooks (for SaaS billing)
app.post('/api/webhooks/stripe/subscriptions', express.raw({ type: 'application/json' }), async (req, res) => {
  const signal = req.headers['stripe-signature'] as string;
  try {
    const result = await handleSubscriptionWebhook(req.body.toString(), signal);
    res.json(result);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// Stripe payment webhooks (for invoice payments)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const signal = req.headers['stripe-signature'] as string;
  try {
    const result = await handleStripeWebhook(req.body.toString(), signal);
    res.json(result);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.post('/api/webhooks/xero', express.raw({ type: 'application/json' }), async (req, res) => {
  const signal = req.headers['x-xero-signature'] as string;
  try {
    const result = await handleXeroWebhook(req.body.toString(), signal);
    res.json(result);
  } catch (err: any) {
    // Xero expectation: Respond with 401 if signature fails, 200 otherwise
    res.status(401).send(`Webhook Error: ${err.message}`);
  }
});

// Regular JSON parsing for other routes
app.use(express.json());

app.use(
  '/api/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static assets
const distPath = path.resolve(__dirname, '../../dist');
const publicPath = path.resolve(__dirname, '../../public-site');

if (process.env.NODE_ENV === 'production') {
  // 1. Serve marketing site at root
  app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });

  // 2. Serve static assets from both dist and public
  app.use(express.static(distPath));
  app.use(express.static(publicPath));

  // 3. All other non-API routes serve the React app
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).end();
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
    // Development fallback
    app.get('/', (req, res) => {
        res.sendFile(path.join(publicPath, 'index.html'));
    });
}

app.listen(port, host, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
