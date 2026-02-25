
import 'dotenv/config';
import { db } from '../src/lib/db';
import { jobs, agentTasks, agentDraftQuotes } from '../src/lib/schema';
import { runPartsLaborAgent } from '../src/agents/parts-labor-agent';
import { desc, eq } from 'drizzle-orm';

async function main() {
    console.log("🛠️  Starting Manual Agent Test...");

    // 1. Get Latest Job
    const latestJob = await db.query.jobs.findFirst({
        orderBy: desc(jobs.createdAt),
        with: {
            vehicle: true
        } as any
    });

    if (!latestJob) {
        console.error("❌ No jobs found in database to test with.");
        process.exit(1);
    }

    console.log(`📋 Found Job #${latestJob.id}: ${latestJob.description}`);
    console.log(`   Vehicle: ${latestJob.vehicle?.year} ${latestJob.vehicle?.make} ${latestJob.vehicle?.model}`);
    console.log(`   Current Agent Status: ${latestJob.agentStatus}`);

    // 2. Trigger Agent
    console.log("\n🚀 Triggering Agent...");
    try {
        await runPartsLaborAgent(latestJob.id);
    } catch (error) {
        console.error("❌ Agent execution failed:", error);
    }

    // 3. Poll for Results
    console.log("\n⏳ Polling for results...");
    
    // Give it a moment (even though runPartsLaborAgent is async, the internal graph might be doing stuff)
    // Actually runPartsLaborAgent awaits the graph, so we should see results immediately.
    
    const task = await db.query.agentTasks.findFirst({
        where: eq(agentTasks.jobId, latestJob.id),
        orderBy: desc(agentTasks.createdAt)
    });

    const quote = await db.query.agentDraftQuotes.findFirst({
        where: eq(agentDraftQuotes.jobId, latestJob.id),
        orderBy: desc(agentDraftQuotes.createdAt)
    });

    console.log("\n📊 Results:");
    console.log("   Task Status:", task?.status);
    console.log("   Task Summary:", task?.resultSummary);
    console.log("   Draft Quote Found:", !!quote);
    if (quote) {
        console.log("   Quote Confidence:", quote.confidenceScore);
        console.log("   Quote Data Preview:", quote.quoteData.substring(0, 100) + "...");
    }

    console.log("\n✅ Test Complete");
    process.exit(0);
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
