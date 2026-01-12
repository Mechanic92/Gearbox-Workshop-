import { writeFileSync } from 'fs';
import { db } from '../src/lib/db';
import * as dbFunctions from '../src/lib/db';

async function test() {
  const output: string[] = [];
  output.push('=== Ledger Onboarding Test ===\n');

  try {
    // Get or create org
    const orgs = await dbFunctions.getOrganizationsByOwner(1);
    let orgId: number;
    
    if (orgs.length > 0) {
      orgId = orgs[0].id;
      output.push(`Using existing org: ${orgs[0].name} (ID: ${orgId})`);
    } else {
      orgId = await dbFunctions.createOrganization({
        ownerId: 1,
        name: 'Test Org',
        subscriptionTier: 'professional',
        subscriptionStatus: 'active'
      });
      output.push(`Created org (ID: ${orgId})`);
    }

    // Test 1: GST disabled
    const ledger1Id = await dbFunctions.createLedger({
      organizationId: orgId,
      name: 'Test Ledger - No GST',
      type: 'trades',
      gstRegistered: false,
      aimEnabled: false
    });
    const ledger1 = await dbFunctions.getLedgerById(ledger1Id);
    output.push(`\nTest 1 - GST Disabled (ID: ${ledger1Id})`);
    output.push(`  gstRegistered: ${ledger1?.gstRegistered} (expected: false) ${ledger1?.gstRegistered === false ? '✓' : '✗'}`);
    output.push(`  gstBasis: ${ledger1?.gstBasis} (expected: payments) ${ledger1?.gstBasis === 'payments' ? '✓' : '✗'}`);
    output.push(`  gstFilingFrequency: ${ledger1?.gstFilingFrequency} (expected: two_monthly) ${ledger1?.gstFilingFrequency === 'two_monthly' ? '✓' : '✗'}`);
    output.push(`  aimEnabled: ${ledger1?.aimEnabled} (expected: false) ${ledger1?.aimEnabled === false ? '✓' : '✗'}`);

    // Test 2: GST enabled - invoice basis
    const ledger2Id = await dbFunctions.createLedger({
      organizationId: orgId,
      name: 'Test Ledger - GST Invoice',
      type: 'trades',
      gstRegistered: true,
      gstBasis: 'invoice',
      gstFilingFrequency: 'monthly',
      aimEnabled: true
    });
    const ledger2 = await dbFunctions.getLedgerById(ledger2Id);
    output.push(`\nTest 2 - GST Enabled Invoice (ID: ${ledger2Id})`);
    output.push(`  gstRegistered: ${ledger2?.gstRegistered} (expected: true) ${ledger2?.gstRegistered === true ? '✓' : '✗'}`);
    output.push(`  gstBasis: ${ledger2?.gstBasis} (expected: invoice) ${ledger2?.gstBasis === 'invoice' ? '✓' : '✗'}`);
    output.push(`  gstFilingFrequency: ${ledger2?.gstFilingFrequency} (expected: monthly) ${ledger2?.gstFilingFrequency === 'monthly' ? '✓' : '✗'}`);
    output.push(`  aimEnabled: ${ledger2?.aimEnabled} (expected: true) ${ledger2?.aimEnabled === true ? '✓' : '✗'}`);

    // Test 3: GST enabled - payments basis
    const ledger3Id = await dbFunctions.createLedger({
      organizationId: orgId,
      name: 'Test Ledger - GST Payments',
      type: 'trades',
      gstRegistered: true,
      gstBasis: 'payments',
      gstFilingFrequency: 'six_monthly',
      aimEnabled: false
    });
    const ledger3 = await dbFunctions.getLedgerById(ledger3Id);
    output.push(`\nTest 3 - GST Enabled Payments (ID: ${ledger3Id})`);
    output.push(`  gstRegistered: ${ledger3?.gstRegistered} (expected: true) ${ledger3?.gstRegistered === true ? '✓' : '✗'}`);
    output.push(`  gstBasis: ${ledger3?.gstBasis} (expected: payments) ${ledger3?.gstBasis === 'payments' ? '✓' : '✗'}`);
    output.push(`  gstFilingFrequency: ${ledger3?.gstFilingFrequency} (expected: six_monthly) ${ledger3?.gstFilingFrequency === 'six_monthly' ? '✓' : '✗'}`);
    output.push(`  aimEnabled: ${ledger3?.aimEnabled} (expected: false) ${ledger3?.aimEnabled === false ? '✓' : '✗'}`);

    // Access control test
    const hasAccess = await dbFunctions.verifyLedgerAccess(1, ledger1Id);
    output.push(`\nAccess Control Test:`);
    output.push(`  Owner has access: ${hasAccess} (expected: true) ${hasAccess === true ? '✓' : '✗'}`);

    const allLedgers = await dbFunctions.getLedgersByOrganization(orgId);
    output.push(`  Can list ledgers: ${allLedgers.length >= 3} (found ${allLedgers.length}) ${allLedgers.length >= 3 ? '✓' : '✗'}`);

    output.push('\n=== All Tests Completed ===');
    
    const result = output.join('\n');
    writeFileSync('test-results.txt', result);
    console.log(result);
    
  } catch (error: any) {
    output.push(`\nERROR: ${error.message}`);
    output.push(error.stack);
    writeFileSync('test-results.txt', output.join('\n'));
    throw error;
  }
}

test().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
