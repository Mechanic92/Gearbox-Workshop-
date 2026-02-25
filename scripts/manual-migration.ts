

import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting manual migration...");

  // 1. Alter jobs table
  try {
    console.log("Adding agentStatus to jobs...");
    await db.run(sql`ALTER TABLE jobs ADD COLUMN agentStatus TEXT DEFAULT 'DISABLED'`);
    console.log("agentStatus added.");
  } catch (e: any) {
    if (e.message.includes("duplicate column name")) {
      console.log("agentStatus already exists.");
    } else {
      console.error("Error adding agentStatus:", e);
    }
  }

  // 2. Create agent_tasks
  console.log("Creating agent_tasks...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS agent_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'PENDING',
      currentStep TEXT,
      error TEXT,
      resultSummary TEXT,
      createdAt INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer))
    )
  `);
  await db.run(sql`CREATE INDEX IF NOT EXISTS agent_task_job_idx ON agent_tasks (jobId)`);

  // 3. Create standard_price_list
  console.log("Creating standard_price_list...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS standard_price_list (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      serviceName TEXT NOT NULL,
      description TEXT,
      baseLaborHours REAL NOT NULL,
      hourlyRate REAL NOT NULL,
      requiredParts TEXT,
      createdAt INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer))
    )
  `);
  await db.run(sql`CREATE INDEX IF NOT EXISTS std_price_ledger_idx ON standard_price_list (ledgerId)`);

  // 4. Create agent_draft_quotes
  console.log("Creating agent_draft_quotes...");
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS agent_draft_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      taskId INTEGER NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
      quoteData TEXT NOT NULL,
      confidenceScore REAL DEFAULT 0,
      agentNotes TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      createdAt INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as integer))
    )
  `);
  await db.run(sql`CREATE INDEX IF NOT EXISTS draft_quote_job_idx ON agent_draft_quotes (jobId)`);

  console.log("Migration complete.");
}

main().catch(console.error);
