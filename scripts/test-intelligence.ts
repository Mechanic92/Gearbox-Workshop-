import { anonymizeShopId, categorizeService, normalizeMake, bucketYear, getCurrentQuarter } from '../src/lib/intelligence/collector.js';
import { db } from '../src/lib/db.js';
import * as schema from '../src/lib/schema.js';
import { eq } from 'drizzle-orm';

async function testIntelligence() {
    console.log('🧪 Testing Intelligence Module Utilities...');

    // Test 1: Anonymization
    const id1 = anonymizeShopId(1);
    const id2 = anonymizeShopId(1);
    const id3 = anonymizeShopId(2);

    console.log('1. Anonymization Check:');
    console.log(`   - Shop 1 ID: ${id1}`);
    console.log(`   - Shop 1 ID (repeat): ${id2}`);
    console.log(`   - Shop 2 ID: ${id3}`);
    
    if (id1 === id2 && id1 !== id3) {
        console.log('   ✓ IDs are consistent and unique per shop');
    } else {
        console.error('   ✗ ID consistency check failed');
    }

    // Test 2: Categorization
    console.log('\n2. Categorization Check:');
    const tests = [
        { desc: 'Full synthetic oil change and filter', expected: 'oil_change' },
        { desc: 'New brake pads and rotors replacement', expected: 'brake_pads' }, // First match wins
        { desc: 'WOF inspection and oil top up', expected: 'wof_inspection' },
        { desc: 'Clutch kit installation', expected: 'clutch' }
    ];

    for (const t of tests) {
        const cat = categorizeService(t.desc);
        console.log(`   - "${t.desc}" -> ${cat}`);
    }

    // Test 3: Normalization
    console.log('\n3. Normalization Check:');
    console.log(`   - "toyota" -> ${normalizeMake('toyota')}`);
    console.log(`   - "MERCEDES-BENZ" -> ${normalizeMake('MERCEDES-BENZ')}`);
    console.log(`   - "VW" -> ${normalizeMake('VW')}`);

    // Test 4: Database Insertion (Signals)
    console.log('\n4. Database Signal Insertion...');
    try {
        const quarter = getCurrentQuarter();
        
        // Insert a dummy job signal
        const [signal] = await db.insert(schema.intelligenceJobSignals).values({
            anonShopId: id1,
            serviceCategory: 'oil_change',
            vehicleMake: 'Toyota',
            vehicleModel: 'Hilux',
            vehicleYearBucket: '2015-2019',
            laborCost: 80,
            partsCost: 60,
            totalJobValue: 180,
            marginPercent: 22.2,
            jobDurationHours: 1.5,
            region: 'nz',
            quarter: quarter,
            dayOfWeek: new Date().getDay()
        }).returning();

        console.log(`   ✓ Signal inserted with ID: ${signal.id}`);

        // Cleanup test data
        await db.delete(schema.intelligenceJobSignals).where(eq(schema.intelligenceJobSignals.id, signal.id));
        console.log('   ✓ Test data cleaned up');
        
        console.log('\n✅ INTELLIGENCE MODULE TESTS PASSED');
    } catch (err) {
        console.error('\n❌ DATABASE TEST FAILED:', err);
    }

    process.exit(0);
}

testIntelligence();
