import { createClient } from "@libsql/client";
import path from 'path';

const client = createClient({ url: "file:local.db" });

async function main() {
  const result = await client.execute("SELECT count(*) as count FROM users");
  console.log("Users count:", result.rows[0].count);
  
  const rules = await client.execute("SELECT * FROM users LIMIT 5");
  console.log("Users:", rules.rows);
  client.close();
}

main();
