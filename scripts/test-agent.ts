
import { db } from "../src/lib/db";
import { jobs, agentTasks, agentDraftQuotes, standardPriceList, users, organizations, ledgers, customers, vehicles } from "../src/lib/schema";
import { runPartsLaborAgent } from "../src/agents/parts-labor-agent";
import { eq } from "drizzle-orm";
import { HumanMessage } from "@langchain/core/messages";

async function main() {
    console.log("Starting Agent Test...");

    // 0. Ensure Base Data Exists (User, Org, Ledger, Customer, Vehicle)
    let userId = 1;
    const user = await db.query.users.findFirst();
    if (!user) {
        const [u] = await db.insert(users).values({
            openId: "test_user",
            name: "Test User",
            email: "test@example.com",
            role: "owner"
        }).returning();
        userId = u.id;
        console.log("Created Test User");
    } else {
        userId = user.id;
    }

    let orgId = 1;
    const org = await db.query.organizations.findFirst();
    if (!org) {
        const [o] = await db.insert(organizations).values({
            ownerId: userId,
            name: "Test Org",
        }).returning();
        orgId = o.id;
        console.log("Created Test Org");
    } else {
        orgId = org.id;
    }

    let ledgerId = 1;
    const ledger = await db.query.ledgers.findFirst();
    if (!ledger) {
        const [l] = await db.insert(ledgers).values({
            organizationId: orgId,
            name: "Test Ledger",
            type: "trades"
        }).returning();
        ledgerId = l.id;
        console.log("Created Test Ledger");
    } else {
        ledgerId = ledger.id;
    }

    let customerId = 1;
    const cust = await db.query.customers.findFirst();
    if (!cust) {
        const [c] = await db.insert(customers).values({
            ledgerId,
            name: "Test Customer",
            email: "customer@example.com"
        }).returning();
        customerId = c.id;
        console.log("Created Test Customer");
    } else {
        customerId = cust.id;
    }

    let vehicleId = 1;
    const veh = await db.query.vehicles.findFirst();
    if (!veh) {
        const [v] = await db.insert(vehicles).values({
            ledgerId,
            customerId,
            licensePlate: "TESTCAR",
            make: "Toyota",
            model: "Corolla",
            year: 2015
        }).returning();
        vehicleId = v.id;
        console.log("Created Test Vehicle");
    } else {
        vehicleId = veh.id;
    }

    // 1. Ensure Standard Price List has data
    const prices = await db.select().from(standardPriceList);
    if (prices.length === 0) {
        console.log("Seeding Price List...");
        await db.insert(standardPriceList).values([
            { ledgerId, serviceName: "Standard Labor Rate", hourlyRate: 120, baseLaborHours: 1 },
            { ledgerId, serviceName: "Oil Change Service", hourlyRate: 120, baseLaborHours: 0.5, requiredParts: JSON.stringify(["Oil Filter", "5W-30 Oil"]) },
        ]);
    }

    // 2. Create Dummy Job (if not exists)
    let jobId = 0;
    const existingJob = await db.query.jobs.findFirst({
        where: eq(jobs.description, "Test Agent Job: Oil Change")
    });
    
    if (existingJob) {
        jobId = existingJob.id;
        console.log(`Using existing job ID: ${jobId}`);
    } else {
        const [result] = await db.insert(jobs).values({
            ledgerId,
            customerId,
            vehicleId,
            jobNumber: "TEST-" + Date.now(),
            description: "Test Agent Job: Oil Change",
            status: "NEW",
            quotedPrice: 0,
            agentStatus: "PENDING"
        }).returning({ insertedId: jobs.id });
        jobId = result.insertedId;
        console.log(`Created new job ID: ${jobId}`);
    }

    // 3. Trigger Agent
    console.log(`Triggering Agent for Job ${jobId}...`);
    
    // Create Agent Task
    const [task] = await db.insert(agentTasks).values({
        jobId,
        status: "PENDING",
    }).returning();
    
    try {
        await runPartsLaborAgent(jobId);
        
        console.log("Agent Triggered (Async process started/finished)");


        // 4. Verify Database Updates
        const updatedTask = await db.query.agentTasks.findFirst({
            where: eq(agentTasks.id, task.id)
        });
        console.log("Updated Task Status:", updatedTask?.status);
        console.log("Task Result Summary:", updatedTask?.resultSummary);

        const drafts = await db.query.agentDraftQuotes.findMany({
            where: eq(agentDraftQuotes.taskId, task.id)
        });
        console.log("Detailed Draft Quotes:", drafts);

    } catch (error) {
        console.error("Agent failed:", error);
    }
}

main().catch(console.error);
