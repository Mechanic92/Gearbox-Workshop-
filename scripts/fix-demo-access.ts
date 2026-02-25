import 'dotenv/config';
import { db } from '../src/lib/db.js';
import * as schema from '../src/lib/schema.js';
import { eq } from 'drizzle-orm';

async function fixDemo() {
  try {
    const demoUser = await db.query.users.findFirst({
        where: eq(schema.users.email, 'demo@gearbox.co.nz')
    });
    
    if (!demoUser) {
        console.error('Demo user not found');
        return;
    }

    const firstLedger = await db.query.ledgers.findFirst();
    if (!firstLedger) {
        console.error('No ledgers found');
        return;
    }

    // Check if access already exists
    const existing = await db.query.ledgerAccess.findFirst({
        where: (access, { and, eq }) => and(
            eq(access.userId, demoUser.id),
            eq(access.ledgerId, firstLedger.id)
        )
    });

    if (!existing) {
        await db.insert(schema.ledgerAccess).values({
            userId: demoUser.id,
            ledgerId: firstLedger.id,
            role: 'owner'
        });
        console.log(`✅ Added access for ${demoUser.email} to ledger ${firstLedger.id}`);
    } else {
        console.log('Access already exists');
    }
  } catch (err) {
    console.error('Error fixing demo:', err);
  }
}

fixDemo();
