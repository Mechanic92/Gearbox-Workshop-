import { createClient } from "@libsql/client";
import path from 'path';

const client = createClient({ url: "file:local.db" });

async function main() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  try {
    await client.execute({
      sql: "INSERT INTO _migrations (name) VALUES (?)",
      args: ["001_phase1_foundation"]
    });
    console.log("Marked 001_phase1_foundation as executed.");
  } catch (e: any) {
    if (e.message.includes("UNIQUE constraint failed")) {
      console.log("Migration already marked as executed.");
    } else {
      console.error("Error marking migration:", e);
    }
  }
  client.close();
}

main();
