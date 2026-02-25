
import { appRouter } from "../src/server/routers";
import { db } from "../src/lib/db";
import { jobs, ledgers, customers, vehicles, organizations, users } from "../src/lib/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Testing Manual Agent Trigger via TRPC...");

  // 1. Setup Context (Mock User)
  const ctx = {
      user: { id: 1, role: "owner" },
      req: {} as any,
      res: {} as any,
  };

  const caller = appRouter.createCaller(ctx);

  // 2. Ensure Data Exists (Reuse logic or assume seed)
  // We'll just grab the first job for simplicity
  const job = await db.query.jobs.findFirst();
  if (!job) {
      console.error("No jobs found. Run test-agent.ts first to create data.");
      return;
  }

  console.log(`Triggering agent for Job ${job.id} via TRPC...`);

  try {
      const result = await caller.agent.trigger({ jobId: job.id });
      console.log("TRPC Result:", result);
  } catch (e) {
      console.error("TRPC Call Failed:", e);
  }

  console.log("Waiting for async agent execution (5s)...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 3. Check Task Status
  const task = await db.query.agentTasks.findFirst({
    where: (agentTasks, { eq }) => eq(agentTasks.jobId, job.id),
    orderBy: (agentTasks, { desc }) => [desc(agentTasks.createdAt)],
  });

  console.log("Latest Agent Task:", task);
}

main().catch(console.error);
