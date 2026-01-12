-- Migration: Add subscription billing tables
-- Version: 002_subscription_billing
-- Date: 2026-01-11

-- ============================================================================
-- SUBSCRIPTION BILLING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL UNIQUE REFERENCES organizations(id),
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  status TEXT CHECK(status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid')) NOT NULL,
  current_period_start INTEGER NOT NULL, -- Unix timestamp
  current_period_end INTEGER NOT NULL, -- Unix timestamp
  cancel_at_period_end INTEGER DEFAULT 0 NOT NULL, -- Boolean
  trial_end INTEGER, -- Unix timestamp
  created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
  updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL
);

CREATE INDEX idx_subscription_org ON subscriptions(organization_id);
CREATE INDEX idx_subscription_stripe_sub ON subscriptions(stripe_subscription_id);

CREATE TABLE IF NOT EXISTS subscription_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  billing_period_start INTEGER NOT NULL, -- Unix timestamp
  billing_period_end INTEGER NOT NULL, -- Unix timestamp
  jobs_created INTEGER DEFAULT 0 NOT NULL,
  storage_used_mb INTEGER DEFAULT 0 NOT NULL,
  active_users INTEGER DEFAULT 0 NOT NULL,
  api_calls INTEGER DEFAULT 0 NOT NULL,
  created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
  updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL
);

CREATE INDEX idx_usage_org ON subscription_usage(organization_id);
CREATE INDEX idx_usage_period ON subscription_usage(billing_period_start, billing_period_end);

CREATE TABLE IF NOT EXISTS billing_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL REFERENCES organizations(id),
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'nzd' NOT NULL,
  status TEXT CHECK(status IN ('draft', 'open', 'paid', 'void', 'uncollectible')) NOT NULL,
  invoice_url TEXT,
  paid_at INTEGER, -- Unix timestamp
  created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL
);

CREATE INDEX idx_billing_org ON billing_history(organization_id);
CREATE INDEX idx_billing_stripe_invoice ON billing_history(stripe_invoice_id);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier TEXT CHECK(tier IN ('starter', 'professional', 'enterprise')) NOT NULL UNIQUE,
  stripe_price_id_monthly TEXT NOT NULL,
  stripe_price_id_yearly TEXT NOT NULL,
  price_monthly REAL NOT NULL,
  price_yearly REAL NOT NULL,
  currency TEXT DEFAULT 'nzd' NOT NULL,
  max_users INTEGER NOT NULL,
  max_jobs_per_month INTEGER NOT NULL, -- -1 for unlimited
  max_storage_mb INTEGER NOT NULL,
  features TEXT NOT NULL, -- JSON array
  active INTEGER DEFAULT 1 NOT NULL, -- Boolean
  created_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL,
  updated_at INTEGER DEFAULT (cast(strftime('%s', 'now') as integer)) NOT NULL
);

-- Seed subscription plans (update Stripe price IDs after creating products in Stripe)
INSERT INTO subscription_plans (tier, stripe_price_id_monthly, stripe_price_id_yearly, price_monthly, price_yearly, max_users, max_jobs_per_month, max_storage_mb, features) VALUES
('starter', 'price_starter_monthly', 'price_starter_yearly', 29.99, 299.00, 2, 50, 5120, '["Digital Vehicle Inspections","Invoice Generation","Stripe Payments","Mobile App","Email Notifications"]'),
('professional', 'price_professional_monthly', 'price_professional_yearly', 69.99, 699.00, 10, -1, 51200, '["Everything in Starter","Xero Integration","Advanced Reporting","Inventory Management","SMS Notifications","Custom Branding","Priority Support"]'),
('enterprise', 'price_enterprise_monthly', 'price_enterprise_yearly', 99.99, 999.00, -1, -1, 204800, '["Everything in Professional","Up to 5 Locations","Multi-Location Reporting","API Access","White-Label Options","Dedicated Account Manager","Phone Support"]');
