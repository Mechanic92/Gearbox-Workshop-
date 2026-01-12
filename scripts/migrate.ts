import { createClient } from "@libsql/client";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dbPath is correct relative to this script
const dbPath = path.join(__dirname, '../local.db');
const migrationsPath = path.join(__dirname, '../migrations');

console.log('🔄 Running database migrations...');
console.log(`Database: ${dbPath}`);
console.log(`Migrations: ${migrationsPath}`);

async function main() {
  // Create database connection
  // Use relative path assuming the script is run from project root (standard for npm scripts)
  const client = createClient({ url: "file:local.db" });

  try {
    // Create migrations table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of executed migrations
    const executedMigrationsResult = await client.execute('SELECT name FROM _migrations ORDER BY id');
    const executedMigrations = executedMigrationsResult.rows.map((row: any) => row.name);

    console.log(`\nExecuted migrations: ${executedMigrations.length}`);

    // Get list of migration files
    const migrationFiles = fs
      .readdirSync(migrationsPath)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`Available migrations: ${migrationFiles.length}\n`);

    // Execute pending migrations
    let migrationsRun = 0;

    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', ''); // Assuming file name is the migration name
      
      if (executedMigrations.includes(migrationName)) {
        console.log(`⏭️  Skipping ${migrationName} (already executed)`);
        continue;
      }

      console.log(`▶️  Executing ${migrationName}...`);
      
      const migrationSQL = fs.readFileSync(
        path.join(migrationsPath, file),
        'utf-8'
      );

      // LibSQL client transaction
      const transaction = await client.transaction("write");
      try {
        // Split functionality might be needed if execute() doesn't support multiple statements in one go
        // But usually it implies one statement per call unless configured. 
        // Libsql client's executeMultiple updates are available in some versions, 
        // but simple execute(sql) with multiple statements might work for local files or might fail.
        // Safer to use executeMultiple if available, or split by ';'.
        // However, migration files can be complex.
        
        // Let's try executing the whole block. 
        // If it fails, we might need to use client.migrate() or similar if available, but here we do custom.
        // 'execute' usually runs a single statement. 'executeMultiple' runs multiple.
        
        await transaction.executeMultiple(migrationSQL);
        
        // Record migration
        await transaction.execute({
            sql: 'INSERT INTO _migrations (name) VALUES (?)',
            args: [migrationName]
        });
        
        await transaction.commit();
        
        console.log(`✅ ${migrationName} completed successfully\n`);
        migrationsRun++;
      } catch (error) {
        await transaction.rollback(); // Rollback is often automatic on error but good to be explicit/safe
        console.error(`❌ Error executing ${migrationName}:`);
        console.error(error);
        process.exit(1);
      } finally {
        transaction.close();
      }
    }

    if (migrationsRun === 0) {
      console.log('✨ Database is up to date. No migrations needed.');
    } else {
      console.log(`\n✨ Successfully executed ${migrationsRun} migration(s).`);
    }

  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    client.close();
  }
}

main();
