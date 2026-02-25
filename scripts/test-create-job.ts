import 'dotenv/config';
import { db } from '../src/lib/db.js';
import * as schema from '../src/lib/schema.js';

async function testCreateJob() {
    try {
        console.log("Testing Job Creation...");
        
        // Ensure we have a ledger
        const ledger = await db.query.ledgers.findFirst();
        if (!ledger) {
            console.log("No ledger found. Create one first.");
            return;
        }

        const jobId = await db.insert(schema.jobs).values({
            ledgerId: ledger.id,
            jobNumber: `TEST-${Date.now()}`,
            description: "Test Job Description",
            quotedPrice: 100.00,
            status: "NEW",
            createdAt: new Date(),
            updatedAt: new Date()
        }).returning({ id: schema.jobs.id });

        console.log("Job Created Successfully. ID:", jobId[0].id);
    } catch (err) {
        console.error("Job Creation Failed:", err);
    }
}

testCreateJob();
