import { db } from '../src/lib/db';
import * as schema from '../src/lib/schema';
import { eq, desc } from 'drizzle-orm';

async function verifyLedgers() {
  console.log('Querying ledgers table...');
  
  const ledgers = await db.query.ledgers.findMany({
    orderBy: desc(schema.ledgers.createdAt),
    limit: 10
  });

  console.log(`\nFound ${ledgers.length} ledgers:\n`);
  
  ledgers.forEach((ledger, idx) => {
    console.log(`${idx + 1}. ${ledger.name} (ID: ${ledger.id})`);
    console.log(`   Type: ${ledger.type}`);
    console.log(`   GST Registered: ${ledger.gstRegistered}`);
    console.log(`   GST Basis: ${ledger.gstBasis}`);
    console.log(`   GST Frequency: ${ledger.gstFilingFrequency}`);
    console.log(`   AIM Enabled: ${ledger.aimEnabled}`);
    console.log(`   Created: ${ledger.createdAt}\n`);
  });

  process.exit(0);
}

verifyLedgers().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
