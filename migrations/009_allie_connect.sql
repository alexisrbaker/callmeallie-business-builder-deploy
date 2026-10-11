-- Allie-only affiliate extension. Exclude this migration and routes from the distributable starter build.
ALTER TABLE affiliates ADD COLUMN stripe_account_id TEXT;
ALTER TABLE affiliates ADD COLUMN stripe_charges_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN stripe_payouts_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN stripe_details_submitted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE affiliates ADD COLUMN updated_at TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliates_stripe_account ON affiliates(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
ALTER TABLE commissions ADD COLUMN provider TEXT;
ALTER TABLE commissions ADD COLUMN provider_payment_intent_id TEXT;
ALTER TABLE commissions ADD COLUMN provider_transfer_id TEXT;
ALTER TABLE commissions ADD COLUMN reversed_cents INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_commissions_order ON commissions(order_id);
CREATE TABLE IF NOT EXISTS affiliate_stripe_events(event_id TEXT PRIMARY KEY,event_type TEXT NOT NULL,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO commission_rules(id,product_id,percent_basis_points,fixed_cents,status) VALUES('rule_affiliate_library','product_business_builder',5000,0,'active');
INSERT OR IGNORE INTO commission_rules(id,product_id,percent_basis_points,fixed_cents,status) VALUES('rule_affiliate_mrr','product_business_builder_mrr',5000,0,'active');
-- No commission rule for recurring content_mrr license billing.
