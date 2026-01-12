import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  saveIntegration,
  getIntegration,
  syncInvoiceToXero,
  disconnectIntegration,
} from '@/lib/integrations/xero-client';

/**
 * Xero Integration Router
 * 
 * Handles OAuth flow and invoice syncing
 */

const t = initTRPC.create();

export const xeroRouter = t.router({
  // Get authorization URL to start OAuth flow
  getAuthUrl: t.procedure.query(async () => {
    const url = await getAuthorizationUrl();
    return { url };
  }),

  // Handle OAuth callback (exchange code for tokens)
  handleCallback: t.procedure
    .input(
      z.object({
        code: z.string(),
        ledgerId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const tokens = await exchangeCodeForTokens(input.code);
      const integrationId = await saveIntegration(input.ledgerId, tokens);

      return {
        success: true,
        integrationId,
        organizationName: tokens.tenantName,
      };
    }),

  // Get integration status
  getStatus: t.procedure
    .input(z.object({ ledgerId: z.number() }))
    .query(async ({ input }) => {
      const integration = await getIntegration(input.ledgerId);
      
      if (!integration) {
        return { connected: false };
      }

      return {
        connected: true,
        expiresAt: integration.expiresAt,
      };
    }),

  // Sync invoice to Xero
  syncInvoice: t.procedure
    .input(
      z.object({
        ledgerId: z.number(),
        invoiceId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await syncInvoiceToXero(input.ledgerId, input.invoiceId);
      return result;
    }),

  // Disconnect integration
  disconnect: t.procedure
    .input(z.object({ ledgerId: z.number() }))
    .mutation(async ({ input }) => {
      await disconnectIntegration(input.ledgerId);
      return { success: true };
    }),
});

export type XeroRouter = typeof xeroRouter;
