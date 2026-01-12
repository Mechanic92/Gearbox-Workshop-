const { createClient } = require("@libsql/client");
const { drizzle } = require("drizzle-orm/libsql");
const fs = require('fs');

async function test() {
  try {
    fs.writeFileSync('test-start.log', 'Script started\n');
    
    const client = createClient({ url: "file:local.db" });
    fs.appendFileSync('test-start.log', 'Client created\n');
    
    const db = drizzle(client);
    fs.appendFileSync('test-start.log', 'DB initialized\n');
    
    const result = await client.execute('SELECT COUNT(*) as count FROM ledgers');
    fs.appendFileSync('test-start.log', `Ledger count: ${JSON.stringify(result.rows)}\n`);
    
    fs.writeFileSync('test-complete.log', 'SUCCESS: Database accessible\n' + JSON.stringify(result.rows, null, 2));
    console.log('Test completed successfully');
    process.exit(0);
  } catch (error) {
    fs.writeFileSync('test-error.log', 'ERROR: ' + error.message + '\n' + error.stack);
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

test();
