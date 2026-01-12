@echo off
echo ========================================
echo   BYPASS SETUP - CREATE LEDGER DIRECTLY
echo ========================================
echo.

cd /d "%~dp0"

echo Creating database and ledger...
echo.

node -e "const { createClient } = require('@libsql/client'); const { drizzle } = require('drizzle-orm/libsql'); const schema = require('./src/lib/schema'); async function setup() { const client = createClient({ url: 'file:./local.db' }); const db = drizzle(client, { schema }); try { const [org] = await db.insert(schema.organizations).values({ name: 'My Workshop', ownerId: 1, subscriptionTier: 'professional' }).returning(); console.log('Organization created:', org.id); const [ledger] = await db.insert(schema.ledgers).values({ organizationId: org.id, name: 'Main Ledger', type: 'trades', gstRegistered: false, aimEnabled: false }).returning(); console.log('Ledger created:', ledger.id); console.log('SUCCESS! Refresh your browser and you should be on the dashboard.'); } catch (e) { console.error('Error:', e.message); } process.exit(0); } setup();"

echo.
echo ========================================
echo   DONE! Refresh your browser now.
echo ========================================
pause
