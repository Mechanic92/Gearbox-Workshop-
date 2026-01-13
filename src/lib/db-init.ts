import { createClient } from "@libsql/client";

/**
 * Initialize the database with all required tables
 * This runs on server startup to ensure tables exist
 */
export async function initializeDatabase() {
  const client = createClient({ 
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  console.log("🔄 Initializing database...");

  const tables = `
    -- Organizations
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      owner_id INTEGER,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      organization_id INTEGER REFERENCES organizations(id),
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Ledgers
    CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      code TEXT,
      currency TEXT DEFAULT 'NZD',
      tax_number TEXT,
      is_gst_registered INTEGER DEFAULT 0,
      gst_basis TEXT DEFAULT 'invoice',
      financial_year_end TEXT DEFAULT '03-31',
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Ledger Access
    CREATE TABLE IF NOT EXISTS ledger_access (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      role TEXT DEFAULT 'viewer',
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Vehicles
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      customer_id INTEGER REFERENCES customers(id),
      registration TEXT NOT NULL,
      make TEXT,
      model TEXT,
      year INTEGER,
      vin TEXT,
      color TEXT,
      odometer INTEGER,
      notes TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Jobs
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      job_number TEXT NOT NULL,
      customer_id INTEGER REFERENCES customers(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      description TEXT,
      status TEXT DEFAULT 'quoted',
      quoted_price REAL,
      customer_name TEXT,
      customer_phone TEXT,
      customer_email TEXT,
      vehicle_registration TEXT,
      vehicle_make TEXT,
      vehicle_model TEXT,
      assigned_technician_id INTEGER,
      scheduled_date INTEGER,
      completed_date INTEGER,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Job Costs
    CREATE TABLE IF NOT EXISTS job_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL REFERENCES jobs(id),
      type TEXT NOT NULL,
      description TEXT,
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      job_id INTEGER REFERENCES jobs(id),
      customer_id INTEGER REFERENCES customers(id),
      invoice_number TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      due_date INTEGER,
      paid_date INTEGER,
      notes TEXT,
      xero_invoice_id TEXT,
      stripe_payment_intent_id TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- DVI Inspections
    CREATE TABLE IF NOT EXISTS dvi_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      job_id INTEGER REFERENCES jobs(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      inspection_number TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      technician_id INTEGER,
      share_token TEXT,
      customer_approved INTEGER DEFAULT 0,
      customer_approved_at INTEGER,
      total_estimated_cost REAL DEFAULT 0,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- DVI Sections
    CREATE TABLE IF NOT EXISTS dvi_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    -- DVI Items
    CREATE TABLE IF NOT EXISTS dvi_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL REFERENCES dvi_inspections(id) ON DELETE CASCADE,
      section_id INTEGER NOT NULL REFERENCES dvi_sections(id),
      item_name TEXT NOT NULL,
      component TEXT,
      condition TEXT,
      status TEXT NOT NULL,
      comment TEXT,
      notes TEXT,
      recommended_action TEXT,
      estimated_cost REAL,
      customer_approved INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- DVI Media
    CREATE TABLE IF NOT EXISTS dvi_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES dvi_items(id) ON DELETE CASCADE,
      type TEXT DEFAULT 'image',
      file_path TEXT,
      image_url TEXT,
      thumbnail_url TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Bookings
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      customer_id INTEGER REFERENCES customers(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      service_type TEXT,
      scheduled_start INTEGER NOT NULL,
      scheduled_end INTEGER,
      bay_id INTEGER,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      vehicle_registration TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Quotes
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      customer_id INTEGER REFERENCES customers(id),
      vehicle_id INTEGER REFERENCES vehicles(id),
      quote_number TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      valid_until INTEGER,
      notes TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Inventory Parts
    CREATE TABLE IF NOT EXISTS inventory_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      sku TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      supplier TEXT,
      cost_price REAL DEFAULT 0,
      sell_price REAL DEFAULT 0,
      quantity_in_stock INTEGER DEFAULT 0,
      reorder_level INTEGER DEFAULT 5,
      location TEXT,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Accounting Integrations
    CREATE TABLE IF NOT EXISTS accounting_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
      provider TEXT NOT NULL,
      access_token_encrypted TEXT,
      refresh_token_encrypted TEXT,
      token_expires_at INTEGER,
      tenant_id TEXT,
      connected_at INTEGER,
      last_sync_at INTEGER,
      sync_status TEXT DEFAULT 'idle',
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Subscriptions
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL REFERENCES organizations(id),
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      stripe_price_id TEXT,
      status TEXT DEFAULT 'trialing',
      tier TEXT DEFAULT 'starter',
      current_period_start INTEGER,
      current_period_end INTEGER,
      cancel_at_period_end INTEGER DEFAULT 0,
      trial_end INTEGER,
      created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    );

    -- Insert default DVI sections
    INSERT OR IGNORE INTO dvi_sections (id, name, sort_order) VALUES (1, 'Exterior', 1);
    INSERT OR IGNORE INTO dvi_sections (id, name, sort_order) VALUES (2, 'Under Hood', 2);
    INSERT OR IGNORE INTO dvi_sections (id, name, sort_order) VALUES (3, 'Under Vehicle', 3);
    INSERT OR IGNORE INTO dvi_sections (id, name, sort_order) VALUES (4, 'Interior', 4);
    INSERT OR IGNORE INTO dvi_sections (id, name, sort_order) VALUES (5, 'Brakes', 5);
    INSERT OR IGNORE INTO dvi_sections (id, name, sort_order) VALUES (6, 'Tires & Wheels', 6);
  `;

  // Execute each statement separately
  const statements = tables.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    if (stmt.trim()) {
      try {
        await client.execute(stmt);
      } catch (err: any) {
        // Ignore "table already exists" errors
        if (!err.message?.includes('already exists')) {
          console.error(`SQL Error: ${err.message}`);
        }
      }
    }
  }

  console.log("✅ Database initialized successfully");
  return true;
}
