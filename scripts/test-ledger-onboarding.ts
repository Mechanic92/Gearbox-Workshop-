import { db } from '../src/lib/db';
import * as dbFunctions from '../src/lib/db';
import * as schema from '../src/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Smoke test for onboarding ledger configuration
 * Tests the complete flow: org creation → ledger creation → validation
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTests() {
  console.log('🧪 Starting Onboarding Ledger Config Smoke Test\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Create organization
    console.log('\n📋 Test 1: Organization Creation');
    let orgId: number;
    
    try {
      const existingOrgs = await dbFunctions.getOrganizationsByOwner(1);
      
      if (existingOrgs.length > 0) {
        orgId = existingOrgs[0].id;
        console.log(`✓ Using existing org: ${existingOrgs[0].name} (ID: ${orgId})`);
        results.push({
          name: 'Organization Creation (reused existing)',
          passed: true,
          details: { orgId, name: existingOrgs[0].name }
        });
      } else {
        orgId = await dbFunctions.createOrganization({
          ownerId: 1,
          name: 'Test Onboarding Org',
          subscriptionTier: 'professional',
          subscriptionStatus: 'active'
        });
        console.log(`✓ Created new org (ID: ${orgId})`);
        results.push({
          name: 'Organization Creation (new)',
          passed: true,
          details: { orgId }
        });
      }
    } catch (error: any) {
      console.error(`✗ Failed: ${error.message}`);
      results.push({
        name: 'Organization Creation',
        passed: false,
        error: error.message
      });
      throw error;
    }

    // Test 2: Create ledger with GST disabled
    console.log('\n📋 Test 2: Ledger Creation (GST Disabled)');
    try {
      const ledgerId1 = await dbFunctions.createLedger({
        organizationId: orgId,
        name: 'Test Trades Ledger - No GST',
        type: 'trades',
        gstRegistered: false,
        aimEnabled: false
      });

      const ledger1 = await dbFunctions.getLedgerById(ledgerId1);
      
      const assertions = [
        { check: 'Ledger created', pass: !!ledger1 },
        { check: 'Type is trades', pass: ledger1?.type === 'trades' },
        { check: 'GST registered is false', pass: ledger1?.gstRegistered === false },
        { check: 'GST basis defaults to payments', pass: ledger1?.gstBasis === 'payments' },
        { check: 'GST frequency defaults to two_monthly', pass: ledger1?.gstFilingFrequency === 'two_monthly' },
        { check: 'AIM disabled', pass: ledger1?.aimEnabled === false }
      ];

      const allPassed = assertions.every(a => a.pass);
      
      console.log(`✓ Created ledger (ID: ${ledgerId1})`);
      assertions.forEach(a => {
        console.log(`  ${a.pass ? '✓' : '✗'} ${a.check}`);
      });

      results.push({
        name: 'Ledger Creation (GST Disabled)',
        passed: allPassed,
        details: { ledgerId: ledgerId1, assertions, ledger: ledger1 }
      });

      if (!allPassed) {
        throw new Error('Some assertions failed for GST disabled ledger');
      }
    } catch (error: any) {
      console.error(`✗ Failed: ${error.message}`);
      results.push({
        name: 'Ledger Creation (GST Disabled)',
        passed: false,
        error: error.message
      });
      throw error;
    }

    // Test 3: Create ledger with GST enabled (invoice basis)
    console.log('\n📋 Test 3: Ledger Creation (GST Enabled - Invoice Basis)');
    try {
      const ledgerId2 = await dbFunctions.createLedger({
        organizationId: orgId,
        name: 'Test Trades Ledger - GST Invoice',
        type: 'trades',
        gstRegistered: true,
        gstBasis: 'invoice',
        gstFilingFrequency: 'monthly',
        aimEnabled: true
      });

      const ledger2 = await dbFunctions.getLedgerById(ledgerId2);
      
      const assertions = [
        { check: 'Ledger created', pass: !!ledger2 },
        { check: 'Type is trades', pass: ledger2?.type === 'trades' },
        { check: 'GST registered is true', pass: ledger2?.gstRegistered === true },
        { check: 'GST basis is invoice', pass: ledger2?.gstBasis === 'invoice' },
        { check: 'GST frequency is monthly', pass: ledger2?.gstFilingFrequency === 'monthly' },
        { check: 'AIM enabled', pass: ledger2?.aimEnabled === true }
      ];

      const allPassed = assertions.every(a => a.pass);
      
      console.log(`✓ Created ledger (ID: ${ledgerId2})`);
      assertions.forEach(a => {
        console.log(`  ${a.pass ? '✓' : '✗'} ${a.check}`);
      });

      results.push({
        name: 'Ledger Creation (GST Enabled - Invoice Basis)',
        passed: allPassed,
        details: { ledgerId: ledgerId2, assertions, ledger: ledger2 }
      });

      if (!allPassed) {
        throw new Error('Some assertions failed for GST enabled ledger');
      }
    } catch (error: any) {
      console.error(`✗ Failed: ${error.message}`);
      results.push({
        name: 'Ledger Creation (GST Enabled - Invoice Basis)',
        passed: false,
        error: error.message
      });
      throw error;
    }

    // Test 4: Create ledger with GST enabled (payments basis)
    console.log('\n📋 Test 4: Ledger Creation (GST Enabled - Payments Basis)');
    try {
      const ledgerId3 = await dbFunctions.createLedger({
        organizationId: orgId,
        name: 'Test Trades Ledger - GST Payments',
        type: 'trades',
        gstRegistered: true,
        gstBasis: 'payments',
        gstFilingFrequency: 'six_monthly',
        aimEnabled: false
      });

      const ledger3 = await dbFunctions.getLedgerById(ledgerId3);
      
      const assertions = [
        { check: 'Ledger created', pass: !!ledger3 },
        { check: 'Type is trades', pass: ledger3?.type === 'trades' },
        { check: 'GST registered is true', pass: ledger3?.gstRegistered === true },
        { check: 'GST basis is payments', pass: ledger3?.gstBasis === 'payments' },
        { check: 'GST frequency is six_monthly', pass: ledger3?.gstFilingFrequency === 'six_monthly' },
        { check: 'AIM disabled', pass: ledger3?.aimEnabled === false }
      ];

      const allPassed = assertions.every(a => a.pass);
      
      console.log(`✓ Created ledger (ID: ${ledgerId3})`);
      assertions.forEach(a => {
        console.log(`  ${a.pass ? '✓' : '✗'} ${a.check}`);
      });

      results.push({
        name: 'Ledger Creation (GST Enabled - Payments Basis)',
        passed: allPassed,
        details: { ledgerId: ledgerId3, assertions, ledger: ledger3 }
      });

      if (!allPassed) {
        throw new Error('Some assertions failed for GST payments ledger');
      }
    } catch (error: any) {
      console.error(`✗ Failed: ${error.message}`);
      results.push({
        name: 'Ledger Creation (GST Enabled - Payments Basis)',
        passed: false,
        error: error.message
      });
      throw error;
    }

    // Test 5: Verify ledger access control
    console.log('\n📋 Test 5: Ledger Access Control');
    try {
      const ledgers = await dbFunctions.getLedgersByOrganization(orgId);
      const hasAccess = await dbFunctions.verifyLedgerAccess(1, ledgers[0].id);
      
      const assertions = [
        { check: 'Can list ledgers by org', pass: ledgers.length >= 3 },
        { check: 'Owner has access to ledger', pass: hasAccess === true }
      ];

      const allPassed = assertions.every(a => a.pass);
      
      assertions.forEach(a => {
        console.log(`  ${a.pass ? '✓' : '✗'} ${a.check}`);
      });

      results.push({
        name: 'Ledger Access Control',
        passed: allPassed,
        details: { ledgerCount: ledgers.length, hasAccess }
      });

      if (!allPassed) {
        throw new Error('Access control assertions failed');
      }
    } catch (error: any) {
      console.error(`✗ Failed: ${error.message}`);
      results.push({
        name: 'Ledger Access Control',
        passed: false,
        error: error.message
      });
      throw error;
    }

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.name}`);
    if (r.error) {
      console.log(`  Error: ${r.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n✅ All onboarding ledger config tests PASSED');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests FAILED');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
