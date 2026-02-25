import 'dotenv/config';
import { db } from '../src/lib/db.js';
import * as schema from '../src/lib/schema.js';
import { eq } from 'drizzle-orm';

async function checkAccess() {
  try {
    const access = await db.query.ledgerAccess.findMany();
    console.log('--- PRODUCTION LEDGER ACCESS ---');
    console.log(JSON.stringify(access, null, 2));
    console.log('--------------------------------');
    
    const ledgers = await db.query.ledgers.findMany();
    console.log('--- PRODUCTION LEDGERS ---');
    console.log(JSON.stringify(ledgers, null, 2));
    console.log('--------------------------');
  } catch (err) {
    console.error('Error checking access:', err);
  }
}

checkAccess();
