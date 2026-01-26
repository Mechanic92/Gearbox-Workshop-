import { XeroClient } from 'xero-node';
import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Xero Integration Client
 * 
 * Handles OAuth 2.0 authentication and API calls to Xero
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-32';
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_BYTES = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

// Initialize Xero client
const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID || '',
  clientSecret: process.env.XERO_CLIENT_SECRET || '',
  redirectUris: [process.env.XERO_REDIRECT_URI || 'http://localhost:3000/api/integrations/xero/callback'],
  scopes: [
    'openid',
    'profile',
    'email',
    'accounting.transactions',
    'accounting.contacts',
    'accounting.settings',
  ],
});

// Encryption helpers
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY_BYTES, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const parts = text.split(':');
  if (parts.length < 2) throw new Error('Invalid encrypted text');
  const iv = Buffer.from(parts.shift()!, 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY_BYTES, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

/**
 * Get authorization URL for OAuth flow
 */
export async function getAuthorizationUrl(): Promise<string> {
  return await xero.buildConsentUrl();
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tenantId: string;
  tenantName: string;
}> {
  const tokenSet = await xero.apiCallback(code);
  
  // Get tenant (organization) info
  await xero.updateTenants();
  const tenants = xero.tenants;
  
  if (!tenants || tenants.length === 0) {
    throw new Error('No Xero organizations found');
  }

  const tenant = tenants[0]; // Use first organization

  return {
    accessToken: tokenSet.access_token!,
    refreshToken: tokenSet.refresh_token!,
    expiresAt: new Date(Date.now() + (tokenSet.expires_in! * 1000)),
    tenantId: tenant.tenantId,
    tenantName: tenant.tenantName || 'Unknown',
  };
}

/**
 * Save integration to database
 */
export async function saveIntegration(
  ledgerId: number,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    tenantId: string;
    tenantName: string;
  }
): Promise<number> {
  // Encrypt tokens before storing
  const encryptedAccessToken = encrypt(tokens.accessToken);
  const encryptedRefreshToken = encrypt(tokens.refreshToken);

  const [result] = await db.insert(schema.accountingIntegrations).values({
    ledgerId,
    provider: 'xero',
    accessToken: encryptedAccessToken,
    refreshToken: encryptedRefreshToken,
    tokenExpiresAt: tokens.expiresAt,
    tenantId: tokens.tenantId,
    organizationName: tokens.tenantName,
    isActive: true,
  }).onConflictDoUpdate({
    target: [schema.accountingIntegrations.ledgerId, schema.accountingIntegrations.provider] as any,
    set: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenExpiresAt: tokens.expiresAt,
      tenantId: tokens.tenantId,
      organizationName: tokens.tenantName,
      isActive: true,
    }
  }).returning();

  return result.id;
}

/**
 * Get integration from database
 */
export async function getIntegration(ledgerId: number): Promise<{
  id: number;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tenantId: string;
} | null> {
  const integration = await db.query.accountingIntegrations.findFirst({
    where: and(
        eq(schema.accountingIntegrations.ledgerId, ledgerId),
        eq(schema.accountingIntegrations.provider, 'xero'),
        eq(schema.accountingIntegrations.isActive, true)
    )
  });

  if (!integration) return null;

  return {
    id: integration.id,
    accessToken: decrypt(integration.accessToken),
    refreshToken: decrypt(integration.refreshToken),
    expiresAt: integration.tokenExpiresAt,
    tenantId: integration.tenantId,
  };
}

/**
 * Refresh access token if expired
 */
export async function refreshTokenIfNeeded(ledgerId: number): Promise<void> {
  const integration = await getIntegration(ledgerId);
  if (!integration) throw new Error('No Xero integration found');

  const now = new Date();
  const expiresIn = integration.expiresAt.getTime() - now.getTime();

  // Refresh if expires in less than 5 minutes
  if (expiresIn < 5 * 60 * 1000) {
    xero.setTokenSet({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    const newTokenSet = await xero.refreshToken();

    // Update database with new tokens
    const encryptedAccessToken = encrypt(newTokenSet.access_token!);
    const encryptedRefreshToken = encrypt(newTokenSet.refresh_token!);
    const newExpiresAt = new Date(Date.now() + (newTokenSet.expires_in! * 1000));

    await db.update(schema.accountingIntegrations)
      .set({ 
        accessToken: encryptedAccessToken, 
        refreshToken: encryptedRefreshToken, 
        tokenExpiresAt: newExpiresAt, 
        lastSyncAt: new Date() 
      })
      .where(eq(schema.accountingIntegrations.id, integration.id));
  }
}

/**
 * Sync invoice to Xero
 */
export async function syncInvoiceToXero(
  ledgerId: number,
  invoiceId: number
): Promise<{ success: boolean; xeroInvoiceId?: string; error?: string }> {
  try {
    await refreshTokenIfNeeded(ledgerId);
    const integration = await getIntegration(ledgerId);
    if (!integration) throw new Error('No Xero integration found');

    // Get invoice from database
    const invoice = await db.query.invoices.findFirst({
      where: eq(schema.invoices.id, invoiceId)
    });

    if (!invoice) throw new Error('Invoice not found');

    // Set token for API call
    xero.setTokenSet({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
    });

    // Create or update contact in Xero
    // For now, we'll assume the customer is linked via the job
    const job = await db.query.jobs.findFirst({ where: eq(schema.jobs.id, invoice.jobId) });
    const customer = job?.customerId ? await db.query.customers.findFirst({ where: eq(schema.customers.id, job.customerId) }) : null;
    
    let contactId = 'MOCK_CONTACT_ID'; // Simplified for now
    if (customer) {
        // Real logic would search/create contact in Xero
    }

    // Create invoice in Xero
    const xeroInvoice: any = {
      type: 'ACCREC',
      contact: { contactID: contactId },
      date: new Date(invoice.invoiceDate).toISOString().split('T')[0],
      dueDate: new Date(invoice.dueDate).toISOString().split('T')[0],
      invoiceNumber: invoice.invoiceNumber,
      lineItems: [
        {
          description: `Job #${invoice.jobId}`,
          quantity: 1,
          unitAmount: invoice.subtotal,
          accountCode: '200',
          taxType: invoice.gstAmount > 0 ? 'OUTPUT' : 'NONE',
        },
      ],
      status: 'AUTHORISED',
    };

    const invoiceResponse = await xero.accountingApi.createInvoices(integration.tenantId, {
      invoices: [xeroInvoice],
    });

    const xeroInvoiceId = invoiceResponse.body.invoices?.[0]?.invoiceID;

    if (xeroInvoiceId) {
      // Log sync
      await db.insert(schema.accountingSyncLog).values({
        integrationId: integration.id,
        entityType: 'invoice',
        entityId: invoiceId.toString(),
        externalId: xeroInvoiceId,
        syncDirection: 'push',
        status: 'success',
      });

      return { success: true, xeroInvoiceId };
    } else {
      throw new Error('No invoice ID returned from Xero');
    }
  } catch (error: any) {
    console.error('Xero sync error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sync payment from Xero (webhook handler)
 */
export async function syncPaymentFromXero(
  ledgerId: number,
  xeroInvoiceId: string,
  paymentAmount: number,
  paymentDate: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find invoice by Xero ID
    // We need to check sync log or invoice field
    const syncLog = await db.query.accountingSyncLog.findFirst({
        where: and(
            eq(schema.accountingSyncLog.externalId, xeroInvoiceId),
            eq(schema.accountingSyncLog.entityType, 'invoice')
        )
    });

    if (!syncLog) {
      throw new Error(`Invoice not found for Xero ID: ${xeroInvoiceId}`);
    }

    const invoiceId = parseInt(syncLog.entityId);

    // Update invoice status
    await db.update(schema.invoices)
        .set({ status: 'paid', paidDate: paymentDate })
        .where(eq(schema.invoices.id, invoiceId));

    // Log sync
    const integration = await getIntegration(ledgerId);
    if (integration) {
      await db.insert(schema.accountingSyncLog).values({
        integrationId: integration.id,
        entityType: 'payment',
        entityId: invoiceId.toString(),
        externalId: xeroInvoiceId,
        syncDirection: 'pull',
        status: 'success',
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Payment sync error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle Xero Webhooks
 */
export async function handleXeroWebhook(payload: string, signature: string): Promise<{ success: boolean }> {
  const webhookKey = process.env.XERO_WEBHOOK_KEY || '';
  
  // Verify signature
  const hmac = crypto.createHmac('sha256', webhookKey);
  hmac.update(payload);
  const calculatedSignature = hmac.digest('base64');

  if (calculatedSignature !== signature) {
    throw new Error('Invalid Xero webhook signature');
  }

  const data = JSON.parse(payload);
  
  // Process events
  for (const event of data.events || []) {
    if (event.eventCategory === 'INVOICE') {
      // Logic to handle invoice status changes (e.g. payment)
      // We can use syncPaymentFromXero here if it's a payment event
      console.log(`Processing Xero event: ${event.eventType} for ${event.resourceId}`);
    }
  }

  return { success: true };
}

/**
 * Disconnect integration
 */
export async function disconnectIntegration(ledgerId: number): Promise<void> {
  await db.update(schema.accountingIntegrations)
    .set({ isActive: false })
    .where(and(
        eq(schema.accountingIntegrations.ledgerId, ledgerId),
        eq(schema.accountingIntegrations.provider, 'xero')
    ));
}
