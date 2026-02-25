import 'dotenv/config';
import { db, getDashboardStats } from '../src/lib/db.js';
import * as schema from '../src/lib/schema.js';

async function testStats() {
  try {
    console.log('Testing getDashboardStats for ledger 1...');
    
    // Test a simpler query first
    const testQuery = await db.select().from(schema.jobs).limit(1);
    console.log('Jobs test query success:', testQuery.length);

    const stats = await getDashboardStats(1);
    console.log('Stats:', stats);
  } catch (err: any) {
    console.error('CRASH in getDashboardStats:', err.message);
    if (err.cause) console.error('CAUSE:', err.cause);
  }
}

testStats();
