import { createClient } from "@libsql/client";

/**
 * Initialize the database with all required tables.
 * Column names EXACTLY match Drizzle schema (src/lib/schema.ts).
 * This is the single source of truth for DB table structure.
 */
export async function initializeDatabase() {
  const client = createClient({ 
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  console.log("🔄 Initializing database...");
  
  // Helper to check if a column exists
  const columnExists = async (table: string, column: string) => {
    try {
      const info = await client.execute(`PRAGMA table_info(${table})`);
      return info.rows.some(row => row.name === column);
    } catch (e) {
      return false;
    }
  };

  // Always force reset in development to ensure schema consistency
  if (process.env.DB_FORCE_RESET === 'true') {
    const dropStatements = [
      'DROP TABLE IF EXISTS dvi_images',
      'DROP TABLE IF EXISTS dvi_items',
      'DROP TABLE IF EXISTS dvi_comment_templates',
      'DROP TABLE IF EXISTS dvi_sections',
      'DROP TABLE IF EXISTS dvi_inspections',
      'DROP TABLE IF EXISTS dvi_templates',
      'DROP TABLE IF EXISTS dviMedia',
      'DROP TABLE IF EXISTS dviItems',
      'DROP TABLE IF EXISTS dviSections',
      'DROP TABLE IF EXISTS dviInspections',
      'DROP TABLE IF EXISTS invoices_extended',
      'DROP TABLE IF EXISTS invoice_settings',
      'DROP TABLE IF EXISTS quote_items',
      'DROP TABLE IF EXISTS quotes',
      'DROP TABLE IF EXISTS job_parts',
      'DROP TABLE IF EXISTS purchase_order_items',
      'DROP TABLE IF EXISTS purchase_orders',
      'DROP TABLE IF EXISTS stock_movements',
      'DROP TABLE IF EXISTS parts',
      'DROP TABLE IF EXISTS part_categories',
      'DROP TABLE IF EXISTS suppliers',
      'DROP TABLE IF EXISTS checklist_items',
      'DROP TABLE IF EXISTS checklist_templates',
      'DROP TABLE IF EXISTS fleets',
      'DROP TABLE IF EXISTS vehicle_part_fitment',
      'DROP TABLE IF EXISTS vehicle_specs',
      'DROP TABLE IF EXISTS markup_rules',
      'DROP TABLE IF EXISTS accounting_sync_log',
      'DROP TABLE IF EXISTS accounting_integrations',
      'DROP TABLE IF EXISTS inventoryParts',
      'DROP TABLE IF EXISTS bookings',
      'DROP TABLE IF EXISTS services',
      'DROP TABLE IF EXISTS jobCosts',
      'DROP TABLE IF EXISTS invoices',
      'DROP TABLE IF EXISTS jobs',
      'DROP TABLE IF EXISTS vehicles',
      'DROP TABLE IF EXISTS customers',
      'DROP TABLE IF EXISTS billing_history',
      'DROP TABLE IF EXISTS subscription_usage',
      'DROP TABLE IF EXISTS subscription_plans',
      'DROP TABLE IF EXISTS subscriptions',
      'DROP TABLE IF EXISTS ledgerAccess',
      'DROP TABLE IF EXISTS audit_log',
      'DROP TABLE IF EXISTS ledgers',
      'DROP TABLE IF EXISTS organizations',
      'DROP TABLE IF EXISTS users',
    ];

    console.log("🗑️ DB_FORCE_RESET=true — Dropping all tables...");
    for (const stmt of dropStatements) {
      try { await client.execute(stmt); } catch (_) {}
    }
  }

  const statements = [

    // ========================================================================
    // CORE: users
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      loginMethod TEXT,
      role TEXT DEFAULT 'user' NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      lastSignedIn INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // audit_log
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL,
      userId INTEGER,
      action TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId INTEGER,
      metadata TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // organizations
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ownerId INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      subscriptionTier TEXT DEFAULT 'starter' NOT NULL,
      subscriptionStatus TEXT DEFAULT 'active' NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // ledgers
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL REFERENCES organizations(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      gstRegistered INTEGER DEFAULT 0 NOT NULL,
      gstBasis TEXT DEFAULT 'payments',
      gstFilingFrequency TEXT DEFAULT 'two_monthly',
      aimEnabled INTEGER DEFAULT 0 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // ledgerAccess
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS ledgerAccess (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      userId INTEGER NOT NULL REFERENCES users(id),
      role TEXT DEFAULT 'technician' NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // customers (before vehicles because vehicles references customers)
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      mobile TEXT,
      address TEXT,
      city TEXT,
      postcode TEXT,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // vehicles
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      customerId INTEGER REFERENCES customers(id),
      licensePlate TEXT NOT NULL,
      vin TEXT,
      make TEXT,
      model TEXT,
      year INTEGER,
      wofExpiry INTEGER,
      regoExpiry INTEGER,
      customerName TEXT,
      customerPhone TEXT,
      customerEmail TEXT,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // jobs
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      customerId INTEGER REFERENCES customers(id),
      vehicleId INTEGER REFERENCES vehicles(id),
      jobNumber TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'NEW' NOT NULL,
      quotedPrice REAL NOT NULL,
      finalPrice REAL,
      customerName TEXT,
      customerPhone TEXT,
      customerEmail TEXT,
      approvalLinkToken TEXT,
      startedAt INTEGER,
      completedAt INTEGER,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // jobCosts
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS jobCosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL REFERENCES jobs(id),
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unitPrice REAL NOT NULL,
      totalCost REAL NOT NULL,
      supplierInvoiceNumber TEXT,
      supplierName TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // invoices
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL REFERENCES jobs(id),
      invoiceNumber TEXT NOT NULL,
      invoiceDate INTEGER NOT NULL,
      dueDate INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      gstAmount REAL NOT NULL,
      totalAmount REAL NOT NULL,
      status TEXT DEFAULT 'draft' NOT NULL,
      paidDate INTEGER,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // services
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      description TEXT,
      basePrice REAL NOT NULL,
      estimatedDuration INTEGER NOT NULL,
      active INTEGER DEFAULT 1 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // bookings  — matches schema.ts exactly
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      customerId INTEGER REFERENCES customers(id),
      serviceId INTEGER NOT NULL REFERENCES services(id),
      scheduledDate INTEGER NOT NULL,
      duration INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      customerName TEXT NOT NULL,
      customerEmail TEXT,
      customerPhone TEXT,
      vehicleInfo TEXT,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // quotes
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      bookingId INTEGER REFERENCES bookings(id),
      jobId INTEGER REFERENCES jobs(id),
      quoteNumber TEXT NOT NULL,
      customerId INTEGER NOT NULL REFERENCES customers(id),
      subtotal REAL NOT NULL,
      gstAmount REAL NOT NULL,
      totalAmount REAL NOT NULL,
      status TEXT DEFAULT 'draft' NOT NULL,
      expiryDate INTEGER NOT NULL,
      approvedDate INTEGER,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // quote_items
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quoteId INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unitPrice REAL NOT NULL,
      totalPrice REAL NOT NULL,
      itemType TEXT NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // DVI: dvi_templates
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS dvi_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // DVI: dvi_sections
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS dvi_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      templateId INTEGER NOT NULL REFERENCES dvi_templates(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // DVI: dvi_comment_templates
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS dvi_comment_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sectionId INTEGER NOT NULL REFERENCES dvi_sections(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      severity TEXT NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // DVI: dvi_inspections
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS dvi_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      jobId INTEGER REFERENCES jobs(id),
      vehicleId INTEGER REFERENCES vehicles(id),
      templateId INTEGER NOT NULL REFERENCES dvi_templates(id),
      inspectionNumber TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress' NOT NULL,
      shareToken TEXT,
      shareExpiryDate INTEGER,
      notes TEXT,
      completedAt INTEGER,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // DVI: dvi_items  — includes component, condition, notes columns
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS dvi_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspectionId INTEGER NOT NULL REFERENCES dvi_inspections(id) ON DELETE CASCADE,
      sectionId INTEGER NOT NULL REFERENCES dvi_sections(id),
      itemName TEXT NOT NULL,
      component TEXT,
      condition TEXT,
      status TEXT NOT NULL,
      comment TEXT,
      notes TEXT,
      recommendedAction TEXT,
      estimatedCost REAL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // DVI: dvi_images
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS dvi_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      itemId INTEGER NOT NULL REFERENCES dvi_items(id) ON DELETE CASCADE,
      imageUrl TEXT NOT NULL,
      imageKey TEXT NOT NULL,
      caption TEXT,
      uploadedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // invoice_settings
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS invoice_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL UNIQUE REFERENCES ledgers(id),
      companyName TEXT NOT NULL,
      companyLogo TEXT,
      companyAddress TEXT,
      companyPhone TEXT,
      companyEmail TEXT,
      bankAccountName TEXT,
      bankAccountNumber TEXT,
      bankAccountSuffix TEXT,
      paymentTermsDays INTEGER DEFAULT 30 NOT NULL,
      invoiceFooter TEXT,
      bayCount INTEGER DEFAULT 2 NOT NULL,
      businessHours TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // invoices_extended
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS invoices_extended (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoiceId INTEGER NOT NULL UNIQUE REFERENCES invoices(id),
      customBrandingApplied INTEGER DEFAULT 0 NOT NULL,
      emailSentDate INTEGER,
      emailSentTo TEXT,
      paymentReceivedDate INTEGER,
      paymentMethod TEXT,
      reminderSentCount INTEGER DEFAULT 0 NOT NULL,
      lastReminderSentDate INTEGER
    )`,

    // ========================================================================
    // accounting_integrations
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS accounting_integrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      provider TEXT NOT NULL,
      accessToken TEXT NOT NULL,
      refreshToken TEXT NOT NULL,
      tokenExpiresAt INTEGER NOT NULL,
      tenantId TEXT NOT NULL,
      organizationName TEXT,
      isActive INTEGER DEFAULT 1 NOT NULL,
      lastSyncAt INTEGER,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // accounting_sync_log
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS accounting_sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      integrationId INTEGER NOT NULL REFERENCES accounting_integrations(id),
      entityType TEXT NOT NULL,
      entityId TEXT NOT NULL,
      externalId TEXT,
      syncDirection TEXT NOT NULL,
      status TEXT NOT NULL,
      errorMessage TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // markup_rules
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS markup_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      minCost REAL NOT NULL,
      maxCost REAL NOT NULL,
      markupPercent REAL NOT NULL,
      isActive INTEGER DEFAULT 1 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // vehicle_specs
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS vehicle_specs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      yearFrom INTEGER NOT NULL,
      yearTo INTEGER NOT NULL,
      fuelType TEXT,
      ccMin INTEGER,
      ccMax INTEGER,
      oilCapacityL REAL,
      oilSpec TEXT,
      filterType TEXT,
      notes TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // vehicle_part_fitment
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS vehicle_part_fitment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      specId INTEGER NOT NULL REFERENCES vehicle_specs(id),
      partType TEXT NOT NULL,
      supplierSku TEXT NOT NULL,
      tradeCost REAL NOT NULL,
      sellPrice REAL NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // fleets
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS fleets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      contactEmail TEXT,
      billingInterval TEXT DEFAULT 'monthly',
      discountRate REAL DEFAULT 0,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // checklist_templates
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS checklist_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      description TEXT,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // checklist_items
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS checklist_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      templateId INTEGER NOT NULL REFERENCES checklist_templates(id),
      label TEXT NOT NULL,
      "order" INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // suppliers
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      contactPerson TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      accountNumber TEXT,
      tradeAccountRef TEXT,
      paymentTerms TEXT,
      notes TEXT,
      isActive INTEGER DEFAULT 1 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // part_categories
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS part_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      name TEXT NOT NULL,
      description TEXT,
      parentId INTEGER REFERENCES part_categories(id),
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // parts
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      partNumber TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      categoryId INTEGER REFERENCES part_categories(id),
      supplierId INTEGER REFERENCES suppliers(id),
      costPrice REAL NOT NULL,
      sellPrice REAL NOT NULL,
      stockQuantity INTEGER DEFAULT 0 NOT NULL,
      minStockLevel INTEGER DEFAULT 0 NOT NULL,
      maxStockLevel INTEGER,
      unit TEXT DEFAULT 'each' NOT NULL,
      location TEXT,
      barcode TEXT,
      imageUrl TEXT,
      isActive INTEGER DEFAULT 1 NOT NULL,
      markupRuleId INTEGER REFERENCES markup_rules(id),
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // stock_movements
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      partId INTEGER NOT NULL REFERENCES parts(id),
      movementType TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unitCost REAL,
      referenceType TEXT,
      referenceId INTEGER,
      notes TEXT,
      createdBy INTEGER REFERENCES users(id),
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // purchase_orders
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      supplierId INTEGER NOT NULL REFERENCES suppliers(id),
      poNumber TEXT NOT NULL,
      orderDate INTEGER NOT NULL,
      expectedDeliveryDate INTEGER,
      actualDeliveryDate INTEGER,
      status TEXT DEFAULT 'draft' NOT NULL,
      subtotal REAL NOT NULL,
      gstAmount REAL NOT NULL,
      totalAmount REAL NOT NULL,
      notes TEXT,
      createdBy INTEGER REFERENCES users(id),
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // purchase_order_items
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchaseOrderId INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      partId INTEGER NOT NULL REFERENCES parts(id),
      quantity INTEGER NOT NULL,
      unitCost REAL NOT NULL,
      totalCost REAL NOT NULL,
      receivedQuantity INTEGER DEFAULT 0 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // job_parts
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS job_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      partId INTEGER NOT NULL REFERENCES parts(id),
      quantity INTEGER NOT NULL,
      unitCost REAL NOT NULL,
      unitPrice REAL NOT NULL,
      totalCost REAL NOT NULL,
      totalPrice REAL NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // subscriptions
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL UNIQUE REFERENCES organizations(id),
      stripeCustomerId TEXT NOT NULL,
      stripeSubscriptionId TEXT NOT NULL UNIQUE,
      stripePriceId TEXT NOT NULL,
      status TEXT NOT NULL,
      currentPeriodStart INTEGER NOT NULL,
      currentPeriodEnd INTEGER NOT NULL,
      cancelAtPeriodEnd INTEGER DEFAULT 0 NOT NULL,
      trialEnd INTEGER,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // subscription_usage
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS subscription_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL REFERENCES organizations(id),
      billingPeriodStart INTEGER NOT NULL,
      billingPeriodEnd INTEGER NOT NULL,
      jobsCreated INTEGER DEFAULT 0 NOT NULL,
      storageUsedMb INTEGER DEFAULT 0 NOT NULL,
      activeUsers INTEGER DEFAULT 0 NOT NULL,
      apiCalls INTEGER DEFAULT 0 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // billing_history
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS billing_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER NOT NULL REFERENCES organizations(id),
      stripeInvoiceId TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'nzd' NOT NULL,
      status TEXT NOT NULL,
      invoiceUrl TEXT,
      paidAt INTEGER,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // subscription_plans
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tier TEXT NOT NULL UNIQUE,
      stripePriceIdMonthly TEXT NOT NULL,
      stripePriceIdYearly TEXT NOT NULL,
      priceMonthly REAL NOT NULL,
      priceYearly REAL NOT NULL,
      currency TEXT DEFAULT 'nzd' NOT NULL,
      maxUsers INTEGER NOT NULL,
      maxJobsPerMonth INTEGER NOT NULL,
      maxStorageMb INTEGER NOT NULL,
      features TEXT NOT NULL,
      active INTEGER DEFAULT 1 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL,
      updatedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,
    
    // ========================================================================
    // autonomous_actions
    // ========================================================================
    `CREATE TABLE IF NOT EXISTS autonomous_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ledgerId INTEGER NOT NULL REFERENCES ledgers(id),
      type TEXT NOT NULL,
      action TEXT NOT NULL,
      result TEXT NOT NULL,
      impact TEXT DEFAULT 'medium' NOT NULL,
      confidence REAL DEFAULT 1.0 NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // ========================================================================
    // ANONYMOUS INTELLIGENCE DATA TABLES (The Data Moat)
    // These tables contain ZERO PII — only anonymized aggregate signals
    // ========================================================================

    `CREATE TABLE IF NOT EXISTS intel_job_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonShopId TEXT NOT NULL,
      serviceCategory TEXT NOT NULL,
      vehicleMake TEXT NOT NULL,
      vehicleModel TEXT NOT NULL,
      vehicleYearBucket TEXT NOT NULL,
      laborCost REAL NOT NULL,
      partsCost REAL NOT NULL,
      totalJobValue REAL NOT NULL,
      marginPercent REAL NOT NULL,
      jobDurationHours REAL NOT NULL,
      region TEXT DEFAULT 'nz' NOT NULL,
      quarter TEXT NOT NULL,
      dayOfWeek INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS intel_part_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonShopId TEXT NOT NULL,
      partCategory TEXT NOT NULL,
      partType TEXT NOT NULL,
      costPrice REAL NOT NULL,
      sellPrice REAL NOT NULL,
      markupPercent REAL NOT NULL,
      vehicleMake TEXT NOT NULL,
      vehicleModel TEXT NOT NULL,
      quarter TEXT NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS intel_booking_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonShopId TEXT NOT NULL,
      serviceType TEXT NOT NULL,
      dayOfWeek INTEGER NOT NULL,
      hourOfDay INTEGER NOT NULL,
      leadTimeDays INTEGER NOT NULL,
      quarter TEXT NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS intel_shop_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anonShopId TEXT NOT NULL,
      activeJobCount INTEGER NOT NULL,
      avgJobValue REAL NOT NULL,
      avgCycleTimeDays REAL NOT NULL,
      bookingConversionRate REAL NOT NULL,
      quoteConversionRate REAL NOT NULL,
      partsPerJob REAL NOT NULL,
      revenuePerBay REAL NOT NULL,
      utilizationRate REAL NOT NULL,
      quarter TEXT NOT NULL,
      month INTEGER NOT NULL,
      createdAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS intel_benchmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      benchmarkType TEXT NOT NULL,
      dimension TEXT NOT NULL,
      region TEXT DEFAULT 'nz' NOT NULL,
      sampleSize INTEGER NOT NULL,
      p25 REAL NOT NULL,
      median REAL NOT NULL,
      p75 REAL NOT NULL,
      mean REAL NOT NULL,
      stddev REAL,
      quarter TEXT NOT NULL,
      computedAt INTEGER DEFAULT (cast(strftime('%s','now') as integer)) NOT NULL
    )`,

    // Intelligence table indexes
    `CREATE INDEX IF NOT EXISTS intel_job_shop_idx ON intel_job_signals(anonShopId)`,
    `CREATE INDEX IF NOT EXISTS intel_job_category_idx ON intel_job_signals(serviceCategory)`,
    `CREATE INDEX IF NOT EXISTS intel_job_make_idx ON intel_job_signals(vehicleMake)`,
    `CREATE INDEX IF NOT EXISTS intel_job_quarter_idx ON intel_job_signals(quarter)`,
    `CREATE INDEX IF NOT EXISTS intel_job_region_idx ON intel_job_signals(region)`,
    `CREATE INDEX IF NOT EXISTS intel_part_shop_idx ON intel_part_signals(anonShopId)`,
    `CREATE INDEX IF NOT EXISTS intel_part_category_idx ON intel_part_signals(partCategory)`,
    `CREATE INDEX IF NOT EXISTS intel_part_quarter_idx ON intel_part_signals(quarter)`,
    `CREATE INDEX IF NOT EXISTS intel_booking_shop_idx ON intel_booking_signals(anonShopId)`,
    `CREATE INDEX IF NOT EXISTS intel_booking_quarter_idx ON intel_booking_signals(quarter)`,
    `CREATE INDEX IF NOT EXISTS intel_booking_day_idx ON intel_booking_signals(dayOfWeek)`,
    `CREATE INDEX IF NOT EXISTS intel_health_shop_idx ON intel_shop_health(anonShopId)`,
    `CREATE INDEX IF NOT EXISTS intel_health_quarter_idx ON intel_shop_health(quarter)`,
    `CREATE INDEX IF NOT EXISTS intel_bench_type_idx ON intel_benchmarks(benchmarkType)`,
    `CREATE INDEX IF NOT EXISTS intel_bench_dimension_idx ON intel_benchmarks(dimension)`,
    `CREATE INDEX IF NOT EXISTS intel_bench_quarter_idx ON intel_benchmarks(quarter)`,
  ];

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('UNIQUE constraint')) {
        console.error(`SQL Error: ${err.message}`);
      }
    }
  }

    // Ensure missing columns in invoices (safeguard for existing DBs)
    const invoiceColumns = [
        { name: 'invoiceDate', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'dueDate', type: 'INTEGER NOT NULL DEFAULT 0' },
        { name: 'subtotal', type: 'REAL NOT NULL DEFAULT 0' },
        { name: 'gstAmount', type: 'REAL NOT NULL DEFAULT 0' },
        { name: 'totalAmount', type: 'REAL NOT NULL DEFAULT 0' }
    ];

    for (const col of invoiceColumns) {
        if (!(await columnExists('invoices', col.name))) {
            console.log(`➕ Adding missing column ${col.name} to invoices`);
            await client.execute(`ALTER TABLE invoices ADD COLUMN ${col.name} ${col.type}`);
        }
    }

    // Ensure missing columns in jobs
    const jobColumns = [
        { name: 'approvalLinkToken', type: 'TEXT' },
        { name: 'startedAt', type: 'INTEGER' },
        { name: 'completedAt', type: 'INTEGER' }
    ];

    for (const col of jobColumns) {
        if (!(await columnExists('jobs', col.name))) {
            console.log(`➕ Adding missing column ${col.name} to jobs`);
            await client.execute(`ALTER TABLE jobs ADD COLUMN ${col.name} ${col.type}`);
        }
    }

  console.log("✅ Database initialized successfully");
  return true;
}
