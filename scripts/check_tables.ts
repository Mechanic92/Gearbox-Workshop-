import { createClient } from "@libsql/client";
import path from 'path';
import { fileURLToPath } from 'url';

const client = createClient({ url: "file:local.db" });

async function main() {
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
  console.log("Tables in local.db:");
  result.rows.forEach(r => console.log(r.name));
  client.close();
}

main();
