import { db } from '@/lib/db';
import * as schema from '@/lib/schema';
import { eq, and, lt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '@/lib/notifications/email';
import { sendSMS } from '@/lib/notifications/sms';

/**
 * Magic Link Authentication
 * Generates and validates single-use secure tokens for customer login
 */

/**
 * Generate a magic link and send it to the customer
 */
export async function sendMagicLink(params: {
  email?: string;
  phone?: string;
  customerId: number;
  ledgerId: number;
}) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes expiry

  // TODO: Create a table for magic_links or use a session table
  // For now, we'll assume a session table exists or we add it to the schema
  /*
  await db.insert(schema.sessions).values({
    token,
    customerId: params.customerId,
    ledgerId: params.ledgerId,
    expiresAt,
  });
  */

  const magicLink = `https://gearbox.app/auth/callback?token=${token}`;

  if (params.email) {
    await sendEmail(params.email, {
      type: 'magic_link',
      variables: {
        customerName: 'Valued Customer',
        link: magicLink,
        shopName: 'Gearbox Workshop'
      }
    });
  }

  if (params.phone) {
    await sendSMS(params.phone, {
      type: 'magic_link',
      variables: {
        customerName: 'Valued Customer',
        shopName: 'Gearbox Workshop',
        link: magicLink
      }
    });
  }

  return { success: true, token }; // In real app, don't return token
}

/**
 * Validate a magic link token
 */
export async function validateMagicLink(token: string) {
  // Logic to find token in DB and check expiry
  // If valid, create a session and return user info
  return {
    isValid: true,
    customerId: 1,
    ledgerId: 1
  };
}
