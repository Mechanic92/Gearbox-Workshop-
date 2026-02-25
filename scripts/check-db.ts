
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Checking tables...");
  const result = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table';`);
  console.log("Tables:", result.rows);
}

main().catch(console.error);
