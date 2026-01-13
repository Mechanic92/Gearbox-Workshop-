import { createClient } from "@libsql/client";

/**
 * Initialize the database with all required tables
 * Column names must match Drizzle schema exactly (camelCase)
 */
export async function initializeDatabase() {
  const client = createClient({ 
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  console.log("🔄 Initializing database...");

  // Execute statements one by one to handle errors gracefully
  const statements = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT DEFAULT 'user',
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      lastSignedIn INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Organizations table
    `CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerId INTEGER NOT NULL,
      name TEXT NOT NULL,
      subscriptionTier TEXT DEFAULT 'starter',
      subscriptionStatus TEXT DEFAULT 'active',
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Ledgers table
    `CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      gstRegistered INTEGER DEFAULT 0,
      gstBasis TEXT DEFAULT 'payments',
      gstFilingFrequency TEXT DEFAULT 'two_monthly',
      aimEnabled INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Ledger Access
    `CREATE TABLE IF NOT EXISTS ledgerAccess (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      role TEXT DEFAULT 'owner',
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Customers
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Vehicles
    `CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      customerId INTEGER,
      registration TEXT NOT NULL,
      make TEXT,
      model TEXT,
      year INTEGER,
      vin TEXT,
      color TEXT,
      odometer INTEGER,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Jobs
    `CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      jobNumber TEXT NOT NULL,
      customerId INTEGER,
      vehicleId INTEGER,
      description TEXT,
      status TEXT DEFAULT 'quoted',
      quotedPrice REAL,
      customerName TEXT,
      customerPhone TEXT,
      customerEmail TEXT,
      vehicleRegistration TEXT,
      vehicleMake TEXT,
      vehicleModel TEXT,
      assignedTechnicianId INTEGER,
      scheduledDate INTEGER,
      completedDate INTEGER,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Job Costs
    `CREATE TABLE IF NOT EXISTS jobCosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      quantity REAL DEFAULT 1,
      unitPrice REAL DEFAULT 0,
      totalCost REAL DEFAULT 0,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Invoices
    `CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      jobId INTEGER,
      customerId INTEGER,
      invoiceNumber TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      taxAmount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      dueDate INTEGER,
      paidDate INTEGER,
      notes TEXT,
      xeroInvoiceId TEXT,
      stripePaymentIntentId TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // DVI Inspections
    `CREATE TABLE IF NOT EXISTS dviInspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      jobId INTEGER,
      vehicleId INTEGER,
      inspectionNumber TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      technicianId INTEGER,
      shareToken TEXT,
      customerApproved INTEGER DEFAULT 0,
      customerApprovedAt INTEGER,
      totalEstimatedCost REAL DEFAULT 0,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // DVI Sections
    `CREATE TABLE IF NOT EXISTS dviSections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sortOrder INTEGER DEFAULT 0
    )`,

    // DVI Items
    `CREATE TABLE IF NOT EXISTS dviItems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspectionId INTEGER NOT NULL,
      sectionId INTEGER NOT NULL,
      itemName TEXT NOT NULL,
      component TEXT,
      condition TEXT,
      status TEXT NOT NULL,
      comment TEXT,
      notes TEXT,
      recommendedAction TEXT,
      estimatedCost REAL,
      customerApproved INTEGER DEFAULT 0,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // DVI Media
    `CREATE TABLE IF NOT EXISTS dviMedia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL,
      type TEXT DEFAULT 'image',
      filePath TEXT,
      imageUrl TEXT,
      thumbnailUrl TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Bookings
    `CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      customerId INTEGER,
      vehicleId INTEGER,
      serviceType TEXT,
      scheduledStart INTEGER NOT NULL,
      scheduledEnd INTEGER,
      bayId INTEGER,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      customerName TEXT,
      customerEmail TEXT,
      customerPhone TEXT,
      vehicleRegistration TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Quotes
    `CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      customerId INTEGER,
      vehicleId INTEGER,
      quoteNumber TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      taxAmount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      validUntil INTEGER,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Inventory Parts
    `CREATE TABLE IF NOT EXISTS inventoryParts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      sku TEXT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      supplier TEXT,
      costPrice REAL DEFAULT 0,
      sellPrice REAL DEFAULT 0,
      quantityInStock INTEGER DEFAULT 0,
      reorderLevel INTEGER DEFAULT 5,
      location TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Accounting Integrations
    `CREATE TABLE IF NOT EXISTS accountingIntegrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      provider TEXT NOT NULL,
      accessTokenEncrypted TEXT,
      refreshTokenEncrypted TEXT,
      tokenExpiresAt INTEGER,
      tenantId TEXT,
      connectedAt INTEGER,
      lastSyncAt INTEGER,
      syncStatus TEXT DEFAULT 'idle',
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Subscriptions
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL,
      stripeCustomerId TEXT,
      stripeSubscriptionId TEXT,
      stripePriceId TEXT,
      status TEXT DEFAULT 'trialing',
      tier TEXT DEFAULT 'starter',
      currentPeriodStart INTEGER,
      currentPeriodEnd INTEGER,
      cancelAtPeriodEnd INTEGER DEFAULT 0,
      trialEnd INTEGER,
      createdAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)),
      updatedAt INTEGER DEFAULT (cast(strftime('%s', 'now') as integer))
    )`,

    // Default DVI sections
    `INSERT OR IGNORE INTO dviSections (id, name, sortOrder) VALUES (1, 'Exterior', 1)`,
    `INSERT OR IGNORE INTO dviSections (id, name, sortOrder) VALUES (2, 'Under Hood', 2)`,
    `INSERT OR IGNORE INTO dviSections (id, name, sortOrder) VALUES (3, 'Under Vehicle', 3)`,
    `INSERT OR IGNORE INTO dviSections (id, name, sortOrder) VALUES (4, 'Interior', 4)`,
    `INSERT OR IGNORE INTO dviSections (id, name, sortOrder) VALUES (5, 'Brakes', 5)`,
    `INSERT OR IGNORE INTO dviSections (id, name, sortOrder) VALUES (6, 'Tires & Wheels', 6)`,

    // Create a default demo user so ledger creation works
    `INSERT OR IGNORE INTO users (id, openId, name, email, role) VALUES (1, 'demo-user', 'Demo User', 'demo@gearbox.co.nz', 'admin')`
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err: any) {
      // Ignore "already exists" errors
      if (!err.message?.includes('already exists') && !err.message?.includes('UNIQUE constraint')) {
        console.error(`SQL Error: ${err.message}`);
      }
    }
  }

  console.log("✅ Database initialized successfully");
  return true;
}
