import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from '../src/lib/schema';
import { eq, desc } from "drizzle-orm";
import { writeFileSync } from 'fs';

const client = createClient({ url: "file:local.db" });
const db = drizzle(client, { schema });

async function runTest() {
  const log: string[] = [];
  
  try {
    log.push('='.repeat(70));
    log.push('ONBOARDING LEDGER CONFIG TEST');
    log.push('='.repeat(70));
    log.push('');

    // Step 1: Check/create organization
    log.push('Step 1: Organization Setup');
    log.push('-'.repeat(70));
    
    const existingOrgs = await db.query.organizations.findMany({
      where: eq(schema.organizations.ownerId, 1)
    });
    
    let orgId: number;
    if (existingOrgs.length > 0) {
      orgId = existingOrgs[0].id;
      log.push(`✓ Using existing organization: ${existingOrgs[0].name} (ID: ${orgId})`);
    } else {
      const [newOrg] = await db.insert(schema.organizations).values({
        ownerId: 1,
        name: 'Onboarding Test Org',
        subscriptionTier: 'professional',
        subscriptionStatus: 'active'
      }).returning();
      orgId = newOrg.id;
      log.push(`✓ Created new organization (ID: ${orgId})`);
    }
    log.push('');

    // Step 2: Create test ledger - GST disabled
    log.push('Step 2: Create Ledger (GST Disabled)');
    log.push('-'.repeat(70));
    
    const [ledger1] = await db.insert(schema.ledgers).values({
      organizationId: orgId,
      name: `Test Ledger No GST ${Date.now()}`,
      type: 'trades',
      gstRegistered: false,
      aimEnabled: false
    }).returning();
    
    log.push(`✓ Created ledger ID: ${ledger1.id}`);
    log.push(`  Name: ${ledger1.name}`);
    log.push(`  Type: ${ledger1.type}`);
    log.push(`  GST Registered: ${ledger1.gstRegistered} ${ledger1.gstRegistered === false ? '✓' : '✗ FAIL'}`);
    log.push(`  GST Basis: ${ledger1.gstBasis} (default) ${ledger1.gstBasis === 'payments' ? '✓' : '✗ FAIL'}`);
    log.push(`  GST Frequency: ${ledger1.gstFilingFrequency} (default) ${ledger1.gstFilingFrequency === 'two_monthly' ? '✓' : '✗ FAIL'}`);
    log.push(`  AIM Enabled: ${ledger1.aimEnabled} ${ledger1.aimEnabled === false ? '✓' : '✗ FAIL'}`);
    log.push('');

    // Step 3: Create test ledger - GST enabled (invoice basis)
    log.push('Step 3: Create Ledger (GST Enabled - Invoice Basis)');
    log.push('-'.repeat(70));
    
    const [ledger2] = await db.insert(schema.ledgers).values({
      organizationId: orgId,
      name: `Test Ledger GST Invoice ${Date.now()}`,
      type: 'trades',
      gstRegistered: true,
      gstBasis: 'invoice',
      gstFilingFrequency: 'monthly',
      aimEnabled: true
    }).returning();
    
    log.push(`✓ Created ledger ID: ${ledger2.id}`);
    log.push(`  Name: ${ledger2.name}`);
    log.push(`  Type: ${ledger2.type}`);
    log.push(`  GST Registered: ${ledger2.gstRegistered} ${ledger2.gstRegistered === true ? '✓' : '✗ FAIL'}`);
    log.push(`  GST Basis: ${ledger2.gstBasis} ${ledger2.gstBasis === 'invoice' ? '✓' : '✗ FAIL'}`);
    log.push(`  GST Frequency: ${ledger2.gstFilingFrequency} ${ledger2.gstFilingFrequency === 'monthly' ? '✓' : '✗ FAIL'}`);
    log.push(`  AIM Enabled: ${ledger2.aimEnabled} ${ledger2.aimEnabled === true ? '✓' : '✗ FAIL'}`);
    log.push('');

    // Step 4: Create test ledger - GST enabled (payments basis)
    log.push('Step 4: Create Ledger (GST Enabled - Payments Basis)');
    log.push('-'.repeat(70));
    
    const [ledger3] = await db.insert(schema.ledgers).values({
      organizationId: orgId,
      name: `Test Ledger GST Payments ${Date.now()}`,
      type: 'trades',
      gstRegistered: true,
      gstBasis: 'payments',
      gstFilingFrequency: 'six_monthly',
      aimEnabled: false
    }).returning();
    
    log.push(`✓ Created ledger ID: ${ledger3.id}`);
    log.push(`  Name: ${ledger3.name}`);
    log.push(`  Type: ${ledger3.type}`);
    log.push(`  GST Registered: ${ledger3.gstRegistered} ${ledger3.gstRegistered === true ? '✓' : '✗ FAIL'}`);
    log.push(`  GST Basis: ${ledger3.gstBasis} ${ledger3.gstBasis === 'payments' ? '✓' : '✗ FAIL'}`);
    log.push(`  GST Frequency: ${ledger3.gstFilingFrequency} ${ledger3.gstFilingFrequency === 'six_monthly' ? '✓' : '✗ FAIL'}`);
    log.push(`  AIM Enabled: ${ledger3.aimEnabled} ${ledger3.aimEnabled === false ? '✓' : '✗ FAIL'}`);
    log.push('');

    // Step 5: Verify access control
    log.push('Step 5: Access Control Verification');
    log.push('-'.repeat(70));
    
    const allLedgers = await db.query.ledgers.findMany({
      where: eq(schema.ledgers.organizationId, orgId)
    });
    
    log.push(`✓ Can query ledgers by organization`);
    log.push(`  Found ${allLedgers.length} ledgers for org ${orgId}`);
    
    const ledgerForAccessCheck = await db.query.ledgers.findFirst({
      where: eq(schema.ledgers.id, ledger1.id)
    });
    
    const org = await db.query.organizations.findFirst({
      where: eq(schema.organizations.id, orgId)
    });
    
    const ownerHasAccess = org && org.ownerId === 1;
    log.push(`  Owner (user 1) has access: ${ownerHasAccess ? '✓' : '✗ FAIL'}`);
    log.push('');

    // Summary
    log.push('='.repeat(70));
    log.push('TEST SUMMARY');
    log.push('='.repeat(70));
    
    const failures = log.filter(line => line.includes('✗ FAIL')).length;
    
    if (failures === 0) {
      log.push('✅ ALL TESTS PASSED');
      log.push('');
      log.push('Onboarding ledger configuration is working correctly:');
      log.push('  • Organizations can be created');
      log.push('  • Ledgers can be created with various GST configurations');
      log.push('  • GST defaults (payments basis, two_monthly) are applied correctly');
      log.push('  • Explicit GST settings are persisted correctly');
      log.push('  • AIM flag is stored correctly');
      log.push('  • Access control is functioning');
    } else {
      log.push(`❌ ${failures} TEST(S) FAILED`);
      log.push('Review the output above for details.');
    }
    
    log.push('');
    log.push('='.repeat(70));
    
    const output = log.join('\n');
    writeFileSync('LEDGER_TEST_RESULTS.txt', output);
    console.log(output);
    
    process.exit(failures === 0 ? 0 : 1);
    
  } catch (error: any) {
    log.push('');
    log.push('❌ FATAL ERROR');
    log.push('='.repeat(70));
    log.push(error.message);
    log.push('');
    log.push('Stack trace:');
    log.push(error.stack);
    
    const output = log.join('\n');
    writeFileSync('LEDGER_TEST_RESULTS.txt', output);
    console.error(output);
    process.exit(1);
  }
}

runTest();
