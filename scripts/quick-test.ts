import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from '../src/lib/schema';

async function quickTest() {
  console.log('Testing database connection...');
  
  const client = createClient({
    url: 'file:./local.db'
  });
  
  const db = drizzle(client, { schema });
  
  try {
    // Test 1: Check if tables exist
    console.log('\n1. Checking tables...');
    const orgs = await db.select().from(schema.organizations).limit(1);
    console.log('✓ Organizations table exists');
    
    // Test 2: Try to create an organization
    console.log('\n2. Creating test organization...');
    const [org] = await db.insert(schema.organizations).values({
      name: 'Test Workshop',
      ownerId: 1,
      subscriptionTier: 'professional'
    }).returning();
    console.log('✓ Organization created:', org.id);
    
    // Test 3: Try to create a ledger
    console.log('\n3. Creating test ledger...');
    const [ledger] = await db.insert(schema.ledgers).values({
      organizationId: org.id,
      name: 'Test Ledger',
      type: 'trades',
      gstRegistered: false,
      aimEnabled: false
    }).returning();
    console.log('✓ Ledger created:', ledger.id);
    
    console.log('\n✅ ALL TESTS PASSED - Database is working!');
    console.log('\nThe issue is likely with the frontend/backend connection.');
    console.log('Make sure BOTH servers are running:');
    console.log('  1. npm run server (port 3000)');
    console.log('  2. npm run dev (port 5173)');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.log('\nRun this to initialize database:');
    console.log('  npm run db:push');
  }
  
  process.exit(0);
}

quickTest();
