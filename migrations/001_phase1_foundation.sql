-- Migration: Add new tables for Phase 1 features
-- Version: 001_phase1_foundation
-- Date: 2026-01-05

-- ============================================================================
-- BOOKINGS TABLE (Website Booking Widget)
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  vehicle_registration TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  service_type TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  status TEXT CHECK(status IN ('pending', 'confirmed', 'converted_to_job', 'cancelled')) DEFAULT 'pending',
  source TEXT DEFAULT 'website',
  notes TEXT,
  confirmation_sent_at TIMESTAMP,
  reminder_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_ledger ON bookings(ledger_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(preferred_date);

-- ============================================================================
-- DIGITAL VEHICLE INSPECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS digital_inspections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER NOT NULL REFERENCES jobs(id),
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  technician_id INTEGER NOT NULL REFERENCES users(id),
  inspection_date TIMESTAMP NOT NULL,
  status TEXT CHECK(status IN ('draft', 'submitted', 'approved', 'declined', 'partially_approved')) DEFAULT 'draft',
  customer_viewed_at TIMESTAMP,
  customer_approved_at TIMESTAMP,
  approval_token TEXT UNIQUE, -- UUID for public access
  total_estimated_cost DECIMAL(10,2) DEFAULT 0,
  total_approved_cost DECIMAL(10,2) DEFAULT 0,
  customer_signature TEXT, -- Base64 encoded signature image
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dvi_job ON digital_inspections(job_id);
CREATE INDEX idx_dvi_token ON digital_inspections(approval_token);
CREATE INDEX idx_dvi_status ON digital_inspections(status);

CREATE TABLE IF NOT EXISTS inspection_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_id INTEGER NOT NULL REFERENCES digital_inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'brakes', 'tires', 'fluids', 'suspension', 'electrical', 'engine', 'body'
  component TEXT NOT NULL,
  condition TEXT CHECK(condition IN ('good', 'fair', 'poor', 'critical')) NOT NULL,
  notes TEXT,
  recommended_action TEXT CHECK(recommended_action IN ('monitor', 'service_soon', 'immediate_repair')) NOT NULL,
  estimated_cost DECIMAL(10,2) DEFAULT 0,
  approved BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspection_items_inspection ON inspection_items(inspection_id);

CREATE TABLE IF NOT EXISTS inspection_media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspection_item_id INTEGER NOT NULL REFERENCES inspection_items(id) ON DELETE CASCADE,
  type TEXT CHECK(type IN ('photo', 'video')) NOT NULL,
  file_path TEXT NOT NULL, -- S3/R2 path
  thumbnail_path TEXT, -- For videos
  file_size INTEGER, -- bytes
  duration INTEGER, -- seconds, for videos
  annotations TEXT, -- JSON array of annotation objects
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspection_media_item ON inspection_media(inspection_item_id);

-- ============================================================================
-- ACCOUNTING INTEGRATIONS (Xero, MYOB, QuickBooks)
-- ============================================================================
CREATE TABLE IF NOT EXISTS accounting_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
  provider TEXT CHECK(provider IN ('xero', 'myob', 'quickbooks')) NOT NULL,
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT NOT NULL, -- Encrypted
  token_expires_at TIMESTAMP NOT NULL,
  tenant_id TEXT, -- Xero tenant ID or equivalent
  organization_name TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sync_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  settings TEXT, -- JSON for provider-specific settings
  UNIQUE(ledger_id, provider)
);

CREATE INDEX idx_accounting_ledger ON accounting_integrations(ledger_id);
CREATE INDEX idx_accounting_provider ON accounting_integrations(provider);

CREATE TABLE IF NOT EXISTS accounting_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id INTEGER NOT NULL REFERENCES accounting_integrations(id),
  entity_type TEXT NOT NULL, -- 'invoice', 'payment', 'customer', 'account'
  entity_id INTEGER NOT NULL, -- Gearbox entity ID
  external_id TEXT, -- ID in accounting system
  sync_direction TEXT CHECK(sync_direction IN ('push', 'pull')) NOT NULL,
  status TEXT CHECK(status IN ('success', 'failed', 'pending')) NOT NULL,
  error_message TEXT,
  request_payload TEXT, -- JSON
  response_payload TEXT, -- JSON
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_log_integration ON accounting_sync_log(integration_id);
CREATE INDEX idx_sync_log_entity ON accounting_sync_log(entity_type, entity_id);
CREATE INDEX idx_sync_log_status ON accounting_sync_log(status);

-- ============================================================================
-- SERVICE REMINDERS
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  reminder_type TEXT CHECK(reminder_type IN ('wof', 'rego', 'service', 'custom')) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT,
  sent_at TIMESTAMP,
  customer_response TEXT CHECK(customer_response IN ('booked', 'declined', 'no_response')),
  booking_id INTEGER REFERENCES bookings(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reminders_vehicle ON service_reminders(vehicle_id);
CREATE INDEX idx_reminders_due_date ON service_reminders(due_date);
CREATE INDEX idx_reminders_sent ON service_reminders(sent_at);

-- ============================================================================
-- MULTI-LOCATION SUPPORT (Future Phase)
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ledger_id INTEGER NOT NULL REFERENCES ledgers(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  postcode TEXT,
  phone TEXT,
  email TEXT,
  business_hours TEXT, -- JSON: {"monday": {"open": "08:00", "close": "17:00"}, ...}
  bay_count INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_ledger ON locations(ledger_id);

CREATE TABLE IF NOT EXISTS user_locations (
  user_id INTEGER NOT NULL REFERENCES users(id),
  location_id INTEGER NOT NULL REFERENCES locations(id),
  role TEXT DEFAULT 'technician', -- 'manager', 'technician', 'admin'
  PRIMARY KEY (user_id, location_id)
);

-- ============================================================================
-- ALTER EXISTING TABLES (Add foreign keys and external IDs)
-- ============================================================================

-- Add location support to existing tables
ALTER TABLE jobs ADD COLUMN location_id INTEGER REFERENCES locations(id);
ALTER TABLE vehicles ADD COLUMN primary_location_id INTEGER REFERENCES locations(id);

-- Add external IDs for accounting sync
ALTER TABLE invoices ADD COLUMN xero_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN myob_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN quickbooks_invoice_id TEXT;

ALTER TABLE customers ADD COLUMN xero_contact_id TEXT;
ALTER TABLE customers ADD COLUMN myob_contact_id TEXT;
ALTER TABLE customers ADD COLUMN quickbooks_customer_id TEXT;

-- Add indexes for external IDs
CREATE INDEX idx_invoices_xero ON invoices(xero_invoice_id);
CREATE INDEX idx_invoices_myob ON invoices(myob_invoice_id);
CREATE INDEX idx_invoices_quickbooks ON invoices(quickbooks_invoice_id);

CREATE INDEX idx_customers_xero ON customers(xero_contact_id);
CREATE INDEX idx_customers_myob ON customers(myob_contact_id);
CREATE INDEX idx_customers_quickbooks ON customers(quickbooks_customer_id);
