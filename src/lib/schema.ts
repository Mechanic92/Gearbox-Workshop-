import { sqliteTable, integer, text, real, index } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

// ============================================================================
// CORE USER & ORGANIZATION TABLES
// ============================================================================

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["owner", "manager", "technician", "admin", "user"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(), 
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
});

export const auditLogs = sqliteTable("audit_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  userId: integer("userId").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entityType").notNull(),
  entityId: integer("entityId"),
  metadata: text("metadata"), // JSON string
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("audit_ledger_idx").on(table.ledgerId),
  userIdx: index("audit_user_idx").on(table.userId),
}));

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerId: integer("ownerId").notNull().references(() => users.id),
  name: text("name").notNull(),
  subscriptionTier: text("subscriptionTier", { enum: ["starter", "professional", "enterprise"] }).default("starter").notNull(),
  subscriptionStatus: text("subscriptionStatus", { enum: ["active", "suspended", "cancelled"] }).default("active").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ownerIdx: index("org_owner_idx").on(table.ownerId), // Changed name to avoid conflict if any
}));

// ============================================================================
// LEDGER TABLES
// ============================================================================

export const ledgers = sqliteTable("ledgers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["trades", "rental"] }).notNull(),
  gstRegistered: integer("gstRegistered", { mode: "boolean" }).default(false).notNull(),
  gstBasis: text("gstBasis", { enum: ["payments", "invoice"] }).default("payments"),
  gstFilingFrequency: text("gstFilingFrequency", { enum: ["monthly", "two_monthly", "six_monthly"] }).default("two_monthly"),
  aimEnabled: integer("aimEnabled", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  orgIdx: index("ledger_org_idx").on(table.organizationId),
}));

export const ledgerAccess = sqliteTable("ledgerAccess", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  userId: integer("userId").notNull().references(() => users.id),
  role: text("role", { enum: ["owner", "manager", "technician", "admin", "viewer"] }).default("technician").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerUserIdx: index("ledger_user_idx").on(table.ledgerId, table.userId),
}));

// ============================================================================
// TRADES LEDGER: VEHICLES
// ============================================================================

export const vehicles = sqliteTable("vehicles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  customerId: integer("customerId").references(() => customers.id),
  licensePlate: text("licensePlate").notNull(),
  vin: text("vin"),
  make: text("make"),
  model: text("model"),
  year: integer("year"),
  wofExpiry: integer("wofExpiry", { mode: "timestamp" }),
  regoExpiry: integer("regoExpiry", { mode: "timestamp" }),
  customerName: text("customerName"),
  customerPhone: text("customerPhone"),
  customerEmail: text("customerEmail"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("vehicle_ledger_idx").on(table.ledgerId),
  plateIdx: index("vehicle_plate_idx").on(table.licensePlate),
}));

// ============================================================================
// TRADES LEDGER: CUSTOMERS
// ============================================================================

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  mobile: text("mobile"),
  address: text("address"),
  city: text("city"),
  postcode: text("postcode"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("customer_ledger_idx").on(table.ledgerId),
  nameIdx: index("customer_name_idx").on(table.name),
  emailIdx: index("customer_email_idx").on(table.email),
}));

// ============================================================================
// TRADES LEDGER: JOBS & JOB COSTING
// ============================================================================

export const jobs = sqliteTable("jobs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  customerId: integer("customerId").references(() => customers.id),
  vehicleId: integer("vehicleId").references(() => vehicles.id),
  jobNumber: text("jobNumber").notNull(),
  description: text("description").notNull(),
  status: text("status", { enum: ["NEW", "IN_PROGRESS", "WAITING_APPROVAL", "COMPLETED", "CLOSED"] }).default("NEW").notNull(),
  quotedPrice: real("quotedPrice").notNull(),
  finalPrice: real("finalPrice"),
  customerName: text("customerName"),
  customerPhone: text("customerPhone"),
  customerEmail: text("customerEmail"),
  approvalLinkToken: text("approvalLinkToken"),
  startedAt: integer("startedAt", { mode: "timestamp" }),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("job_ledger_idx").on(table.ledgerId),
  jobNumberIdx: index("job_number_idx").on(table.jobNumber),
  statusIdx: index("job_status_idx").on(table.status),
}));

export const jobCosts = sqliteTable("jobCosts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("jobId").notNull().references(() => jobs.id),
  type: text("type", { enum: ["labor", "parts", "overhead"] }).notNull(),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  totalCost: real("totalCost").notNull(),
  supplierInvoiceNumber: text("supplierInvoiceNumber"),
  supplierName: text("supplierName"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  jobIdx: index("job_cost_job_idx").on(table.jobId),
  typeIdx: index("job_cost_type_idx").on(table.type),
}));

// ============================================================================
// INVOICES
// ============================================================================

export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("jobId").notNull().references(() => jobs.id),
  invoiceNumber: text("invoiceNumber").notNull(),
  invoiceDate: integer("invoiceDate", { mode: "timestamp" }).notNull(),
  dueDate: integer("dueDate", { mode: "timestamp" }).notNull(),
  subtotal: real("subtotal").notNull(),
  gstAmount: real("gstAmount").notNull(),
  totalAmount: real("totalAmount").notNull(),
  status: text("status", { enum: ["draft", "sent", "paid", "overdue", "cancelled"] }).default("draft").notNull(),
  paidDate: integer("paidDate", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  jobIdx: index("invoice_job_idx").on(table.jobId),
  invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),
}));

// ============================================================================
// SERVICES & BOOKINGS
// ============================================================================

export const services = sqliteTable("services", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  name: text("name").notNull(),
  description: text("description"),
  basePrice: real("basePrice").notNull(),
  estimatedDuration: integer("estimatedDuration").notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("service_ledger_idx").on(table.ledgerId),
}));

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  customerId: integer("customerId").references(() => customers.id),
  serviceId: integer("serviceId").notNull().references(() => services.id),
  scheduledDate: integer("scheduledDate", { mode: "timestamp" }).notNull(),
  duration: integer("duration").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "in_progress", "completed", "cancelled"] }).default("pending").notNull(),
  customerName: text("customerName").notNull(),
  customerEmail: text("customerEmail"),
  customerPhone: text("customerPhone"),
  vehicleInfo: text("vehicleInfo"), // JSON: plate, make, model, year
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("booking_ledger_idx").on(table.ledgerId),
  customerIdx: index("booking_customer_idx").on(table.customerId),
  dateIdx: index("booking_date_idx").on(table.scheduledDate),
  statusIdx: index("booking_status_idx").on(table.status),
}));

// ============================================================================
// QUOTES
// ============================================================================

export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  bookingId: integer("bookingId").references(() => bookings.id),
  jobId: integer("jobId").references(() => jobs.id),
  quoteNumber: text("quoteNumber").notNull(),
  customerId: integer("customerId").notNull().references(() => customers.id),
  subtotal: real("subtotal").notNull(),
  gstAmount: real("gstAmount").notNull(),
  totalAmount: real("totalAmount").notNull(),
  status: text("status", { enum: ["draft", "sent", "approved", "rejected", "expired"] }).default("draft").notNull(),
  expiryDate: integer("expiryDate", { mode: "timestamp" }).notNull(),
  approvedDate: integer("approvedDate", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("quote_ledger_idx").on(table.ledgerId),
  bookingIdx: index("quote_booking_idx").on(table.bookingId),
  jobIdx: index("quote_job_idx").on(table.jobId),
  customerIdx: index("quote_customer_idx").on(table.customerId),
  quoteNumberIdx: index("quote_number_idx").on(table.quoteNumber),
  statusIdx: index("quote_status_idx").on(table.status),
}));

export const quoteItems = sqliteTable("quote_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quoteId: integer("quoteId").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unitPrice").notNull(),
  totalPrice: real("totalPrice").notNull(),
  itemType: text("itemType", { enum: ["labor", "parts", "materials", "other"] }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  quoteIdx: index("quote_item_idx").on(table.quoteId),
}));

// ============================================================================
// DVI (DIGITAL VEHICLE INSPECTION)
// ============================================================================

export const dviTemplates = sqliteTable("dvi_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  name: text("name").notNull(),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("dvi_template_ledger_idx").on(table.ledgerId),
}));

export const dviSections = sqliteTable("dvi_sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("templateId").notNull().references(() => dviTemplates.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  templateIdx: index("dvi_section_template_idx").on(table.templateId),
}));

export const dviCommentTemplates = sqliteTable("dvi_comment_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("sectionId").notNull().references(() => dviSections.id, { onDelete: "cascade" }),
  comment: text("comment").notNull(),
  severity: text("severity", { enum: ["green", "amber", "red"] }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  sectionIdx: index("dvi_comment_section_idx").on(table.sectionId),
}));

export const dviInspections = sqliteTable("dvi_inspections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  jobId: integer("jobId").references(() => jobs.id),
  vehicleId: integer("vehicleId").references(() => vehicles.id),
  templateId: integer("templateId").notNull().references(() => dviTemplates.id),
  inspectionNumber: text("inspectionNumber").notNull(),
  status: text("status", { enum: ["in_progress", "completed", "shared"] }).default("in_progress").notNull(),
  shareToken: text("shareToken"),
  shareExpiryDate: integer("shareExpiryDate", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  completedAt: integer("completedAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("dvi_inspection_ledger_idx").on(table.ledgerId),
  jobIdx: index("dvi_inspection_job_idx").on(table.jobId),
  vehicleIdx: index("dvi_inspection_vehicle_idx").on(table.vehicleId),
  inspectionNumberIdx: index("dvi_inspection_number_idx").on(table.inspectionNumber),
  shareTokenIdx: index("dvi_inspection_token_idx").on(table.shareToken),
}));

export const dviItems = sqliteTable("dvi_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  inspectionId: integer("inspectionId").notNull().references(() => dviInspections.id, { onDelete: "cascade" }),
  sectionId: integer("sectionId").notNull().references(() => dviSections.id),
  itemName: text("itemName").notNull(),
  component: text("component"),
  condition: text("condition"),
  status: text("status", { enum: ["green", "amber", "red"] }).notNull(),
  comment: text("comment"),
  notes: text("notes"),
  recommendedAction: text("recommendedAction"),
  estimatedCost: real("estimatedCost"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  inspectionIdx: index("dvi_item_inspection_idx").on(table.inspectionId),
  sectionIdx: index("dvi_item_section_idx").on(table.sectionId),
}));

export const dviImages = sqliteTable("dvi_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("itemId").notNull().references(() => dviItems.id, { onDelete: "cascade" }),
  imageUrl: text("imageUrl").notNull(),
  imageKey: text("imageKey").notNull(),
  caption: text("caption"),
  uploadedAt: integer("uploadedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  itemIdx: index("dvi_image_item_idx").on(table.itemId),
}));

export const invoiceSettings = sqliteTable("invoice_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().unique().references(() => ledgers.id),
  companyName: text("companyName").notNull(),
  companyLogo: text("companyLogo"),
  companyAddress: text("companyAddress"),
  companyPhone: text("companyPhone"),
  companyEmail: text("companyEmail"),
  bankAccountName: text("bankAccountName"),
  bankAccountNumber: text("bankAccountNumber"),
  bankAccountSuffix: text("bankAccountSuffix"),
  paymentTermsDays: integer("paymentTermsDays").default(30).notNull(),
  invoiceFooter: text("invoiceFooter"),
  bayCount: integer("bayCount").default(2).notNull(),
  businessHours: text("businessHours"), // JSON configuration
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("invoice_settings_ledger_idx").on(table.ledgerId),
}));

export const invoicesExtended = sqliteTable("invoices_extended", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoiceId").notNull().unique().references(() => invoices.id),
  customBrandingApplied: integer("customBrandingApplied", { mode: "boolean" }).default(false).notNull(),
  emailSentDate: integer("emailSentDate", { mode: "timestamp" }),
  emailSentTo: text("emailSentTo"),
  paymentReceivedDate: integer("paymentReceivedDate", { mode: "timestamp" }),
  paymentMethod: text("paymentMethod", { enum: ["bank_transfer", "cash", "card", "cheque", "other"] }),
  reminderSentCount: integer("reminderSentCount").default(0).notNull(),
  lastReminderSentDate: integer("lastReminderSentDate", { mode: "timestamp" }),
}, (table) => ({
  invoiceIdx: index("invoice_extended_idx").on(table.invoiceId),
}));

// ============================================================================
// ACCOUNTING INTEGRATIONS
// ============================================================================

export const accountingIntegrations = sqliteTable("accounting_integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  provider: text("provider", { enum: ["xero", "myob", "quickbooks"] }).notNull(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken").notNull(),
  tokenExpiresAt: integer("tokenExpiresAt", { mode: "timestamp" }).notNull(),
  tenantId: text("tenantId").notNull(),
  organizationName: text("organizationName"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  lastSyncAt: integer("lastSyncAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("accounting_integration_ledger_idx").on(table.ledgerId),
  uniqueLedgerProvider: index("accounting_integration_unique_idx").on(table.ledgerId, table.provider),
}));

export const accountingSyncLog = sqliteTable("accounting_sync_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  integrationId: integer("integrationId").notNull().references(() => accountingIntegrations.id),
  entityType: text("entityType", { enum: ["invoice", "payment", "contact", "inventory"] }).notNull(),
  entityId: text("entityId").notNull(),
  externalId: text("externalId"),
  syncDirection: text("syncDirection", { enum: ["push", "pull"] }).notNull(),
  status: text("status", { enum: ["success", "failed", "pending"] }).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  integrationIdx: index("accounting_sync_integration_idx").on(table.integrationId),
}));

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

export const markupRules = sqliteTable("markup_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  minCost: real("minCost").notNull(),
  maxCost: real("maxCost").notNull(),
  markupPercent: real("markupPercent").notNull(),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
});

export const vehicleSpecs = sqliteTable("vehicle_specs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  make: text("make").notNull(),
  model: text("model").notNull(),
  yearFrom: integer("yearFrom").notNull(),
  yearTo: integer("yearTo").notNull(),
  fuelType: text("fuelType"),
  ccMin: integer("ccMin"),
  ccMax: integer("ccMax"),
  oilCapacityL: real("oilCapacityL"),
  oilSpec: text("oilSpec"),
  filterType: text("filterType"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  makeModelIdx: index("spec_make_model_idx").on(table.make, table.model),
}));

export const vehiclePartFitment = sqliteTable("vehicle_part_fitment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  specId: integer("specId").notNull().references(() => vehicleSpecs.id),
  partType: text("partType").notNull(), // oil_filter, brake_pads_front, etc
  supplierSku: text("supplierSku").notNull(),
  tradeCost: real("tradeCost").notNull(),
  sellPrice: real("sellPrice").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  specIdx: index("fitment_spec_idx").on(table.specId),
}));

export const fleets = sqliteTable("fleets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  name: text("name").notNull(),
  contactEmail: text("contactEmail"),
  billingInterval: text("billingInterval", { enum: ["monthly", "quarterly", "consolidated"] }).default("monthly"),
  discountRate: real("discountRate").default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("fleet_ledger_idx").on(table.ledgerId),
}));

export const checklistTemplates = sqliteTable("checklist_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  name: text("name").notNull(), // Basic Service, PPI, etc
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
});

export const checklistItems = sqliteTable("checklist_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  templateId: integer("templateId").notNull().references(() => checklistTemplates.id),
  label: text("label").notNull(),
  order: integer("order").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
});

export const suppliers = sqliteTable("suppliers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  name: text("name").notNull(),
  contactPerson: text("contactPerson"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  accountNumber: text("accountNumber"),
  tradeAccountRef: text("tradeAccountRef"),
  paymentTerms: text("paymentTerms"),
  notes: text("notes"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("supplier_ledger_idx").on(table.ledgerId),
}));

export const partCategories = sqliteTable("part_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parentId").references(() => partCategories.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("part_category_ledger_idx").on(table.ledgerId),
}));

export const parts = sqliteTable("parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  partNumber: text("partNumber").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: integer("categoryId").references(() => partCategories.id),
  supplierId: integer("supplierId").references(() => suppliers.id),
  costPrice: real("costPrice").notNull(),
  sellPrice: real("sellPrice").notNull(),
  stockQuantity: integer("stockQuantity").default(0).notNull(),
  minStockLevel: integer("minStockLevel").default(0).notNull(),
  maxStockLevel: integer("maxStockLevel"),
  unit: text("unit").default("each").notNull(), // each, litre, kg, metre
  location: text("location"), // Shelf/bin location
  barcode: text("barcode"),
  imageUrl: text("imageUrl"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  markupRuleId: integer("markupRuleId").references(() => markupRules.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("part_ledger_idx").on(table.ledgerId),
  partNumberIdx: index("part_number_idx").on(table.partNumber),
  categoryIdx: index("part_category_idx").on(table.categoryId),
  supplierIdx: index("part_supplier_idx").on(table.supplierId),
  markupIdx: index("part_markup_idx").on(table.markupRuleId),
}));

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  partId: integer("partId").notNull().references(() => parts.id),
  movementType: text("movementType", { enum: ["purchase", "sale", "adjustment", "return", "transfer"] }).notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: real("unitCost"),
  referenceType: text("referenceType"), // job, purchase_order, adjustment
  referenceId: integer("referenceId"),
  notes: text("notes"),
  createdBy: integer("createdBy").references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("stock_movement_ledger_idx").on(table.ledgerId),
  partIdx: index("stock_movement_part_idx").on(table.partId),
  createdAtIdx: index("stock_movement_created_idx").on(table.createdAt),
}));

export const purchaseOrders = sqliteTable("purchase_orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ledgerId: integer("ledgerId").notNull().references(() => ledgers.id),
  supplierId: integer("supplierId").notNull().references(() => suppliers.id),
  poNumber: text("poNumber").notNull(),
  orderDate: integer("orderDate", { mode: "timestamp" }).notNull(),
  expectedDeliveryDate: integer("expectedDeliveryDate", { mode: "timestamp" }),
  actualDeliveryDate: integer("actualDeliveryDate", { mode: "timestamp" }),
  status: text("status", { enum: ["draft", "sent", "confirmed", "received", "cancelled"] }).default("draft").notNull(),
  subtotal: real("subtotal").notNull(),
  gstAmount: real("gstAmount").notNull(),
  totalAmount: real("totalAmount").notNull(),
  notes: text("notes"),
  createdBy: integer("createdBy").references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  ledgerIdx: index("po_ledger_idx").on(table.ledgerId),
  supplierIdx: index("po_supplier_idx").on(table.supplierId),
  poNumberIdx: index("po_number_idx").on(table.poNumber),
}));

export const purchaseOrderItems = sqliteTable("purchase_order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  purchaseOrderId: integer("purchaseOrderId").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  partId: integer("partId").notNull().references(() => parts.id),
  quantity: integer("quantity").notNull(),
  unitCost: real("unitCost").notNull(),
  totalCost: real("totalCost").notNull(),
  receivedQuantity: integer("receivedQuantity").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  poIdx: index("po_item_po_idx").on(table.purchaseOrderId),
  partIdx: index("po_item_part_idx").on(table.partId),
}));

export const jobParts = sqliteTable("job_parts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  jobId: integer("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  partId: integer("partId").notNull().references(() => parts.id),
  quantity: integer("quantity").notNull(),
  unitCost: real("unitCost").notNull(),
  unitPrice: real("unitPrice").notNull(), // Sell price
  totalCost: real("totalCost").notNull(),
  totalPrice: real("totalPrice").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  jobIdx: index("job_part_job_idx").on(table.jobId),
  partIdx: index("job_part_part_idx").on(table.partId),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  customer: one(customers, { fields: [jobs.customerId], references: [customers.id] }),
  vehicle: one(vehicles, { fields: [jobs.vehicleId], references: [vehicles.id] }),
  costs: many(jobCosts),
  inspections: many(dviInspections),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  customer: one(customers, { fields: [vehicles.customerId], references: [customers.id] }),
  jobs: many(jobs),
  inspections: many(dviInspections),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  vehicles: many(vehicles),
  jobs: many(jobs),
}));

export const dviInspectionsRelations = relations(dviInspections, ({ one, many }) => ({
  job: one(jobs, { fields: [dviInspections.jobId], references: [jobs.id] }),
  vehicle: one(vehicles, { fields: [dviInspections.vehicleId], references: [vehicles.id] }),
  template: one(dviTemplates, { fields: [dviInspections.templateId], references: [dviTemplates.id] }),
  items: many(dviItems),
}));

export const dviItemsRelations = relations(dviItems, ({ one, many }) => ({
  inspection: one(dviInspections, { fields: [dviItems.inspectionId], references: [dviInspections.id] }),
  section: one(dviSections, { fields: [dviItems.sectionId], references: [dviSections.id] }),
  images: many(dviImages),
}));

export const dviImagesRelations = relations(dviImages, ({ one }) => ({
  item: one(dviItems, { fields: [dviImages.itemId], references: [dviItems.id] }),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  ledgers: many(ledgers),
}));

export const ledgersRelations = relations(ledgers, ({ one, many }) => ({
  organization: one(organizations, { fields: [ledgers.organizationId], references: [organizations.id] }),
  access: many(ledgerAccess),
}));

// ============================================================================
// SUBSCRIPTION BILLING (SaaS Monetization)
// ============================================================================

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull().unique().references(() => organizations.id),
  stripeCustomerId: text("stripeCustomerId").notNull(),
  stripeSubscriptionId: text("stripeSubscriptionId").notNull().unique(),
  stripePriceId: text("stripePriceId").notNull(),
  status: text("status", { enum: ["active", "trialing", "past_due", "canceled", "unpaid"] }).notNull(),
  currentPeriodStart: integer("currentPeriodStart", { mode: "timestamp" }).notNull(),
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp" }).notNull(),
  cancelAtPeriodEnd: integer("cancelAtPeriodEnd", { mode: "boolean" }).default(false).notNull(),
  trialEnd: integer("trialEnd", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  orgIdx: index("subscription_org_idx").on(table.organizationId),
  stripeSubIdx: index("subscription_stripe_sub_idx").on(table.stripeSubscriptionId),
}));

export const subscriptionUsage = sqliteTable("subscription_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  billingPeriodStart: integer("billingPeriodStart", { mode: "timestamp" }).notNull(),
  billingPeriodEnd: integer("billingPeriodEnd", { mode: "timestamp" }).notNull(),
  jobsCreated: integer("jobsCreated").default(0).notNull(),
  storageUsedMb: integer("storageUsedMb").default(0).notNull(),
  activeUsers: integer("activeUsers").default(0).notNull(),
  apiCalls: integer("apiCalls").default(0).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  orgIdx: index("usage_org_idx").on(table.organizationId),
  periodIdx: index("usage_period_idx").on(table.billingPeriodStart, table.billingPeriodEnd),
}));

export const billingHistory = sqliteTable("billing_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  organizationId: integer("organizationId").notNull().references(() => organizations.id),
  stripeInvoiceId: text("stripeInvoiceId").notNull().unique(),
  amount: real("amount").notNull(),
  currency: text("currency").default("nzd").notNull(),
  status: text("status", { enum: ["draft", "open", "paid", "void", "uncollectible"] }).notNull(),
  invoiceUrl: text("invoiceUrl"),
  paidAt: integer("paidAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
}, (table) => ({
  orgIdx: index("billing_org_idx").on(table.organizationId),
  stripeInvoiceIdx: index("billing_stripe_invoice_idx").on(table.stripeInvoiceId),
}));

export const subscriptionPlans = sqliteTable("subscription_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tier: text("tier", { enum: ["starter", "professional", "enterprise"] }).notNull().unique(),
  stripePriceIdMonthly: text("stripePriceIdMonthly").notNull(),
  stripePriceIdYearly: text("stripePriceIdYearly").notNull(),
  priceMonthly: real("priceMonthly").notNull(),
  priceYearly: real("priceYearly").notNull(),
  currency: text("currency").default("nzd").notNull(),
  maxUsers: integer("maxUsers").notNull(),
  maxJobsPerMonth: integer("maxJobsPerMonth").notNull(),
  maxStorageMb: integer("maxStorageMb").notNull(),
  features: text("features").notNull(), // JSON array
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).default(sql`(cast(strftime('%s', 'now') as integer))`).notNull(),
});
