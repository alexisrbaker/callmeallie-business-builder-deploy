PRAGMA foreign_keys = ON;

-- Central commercial-license billing. The recurring Stripe subscription is
-- authoritative for whether NEW licensed commercial use is active.
ALTER TABLE licenses ADD COLUMN accepted_terms_id TEXT;
ALTER TABLE licenses ADD COLUMN billing_customer_id TEXT;
ALTER TABLE licenses ADD COLUMN current_period_end TEXT;
ALTER TABLE licenses ADD COLUMN canceled_at TEXT;
ALTER TABLE licenses ADD COLUMN updated_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_billing_subscription
  ON licenses(billing_provider,billing_subscription_id)
  WHERE billing_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_licenses_owner_type
  ON licenses(owner_user_id,license_type_id,status);

INSERT OR IGNORE INTO license_types(id,key,name,description,status)
VALUES('license_type_content_mrr','content_mrr','Business Builder Content MRR','Commercial right to make new sales of the designated Business Builder MRR package while the license remains active.','active');
INSERT OR IGNORE INTO license_types(id,key,name,description,status)
VALUES('license_type_website_use','website_use','Website Use License','Reserved for a future deployable website use license.','draft');
INSERT OR IGNORE INTO license_types(id,key,name,description,status)
VALUES('license_type_website_reseller','website_reseller','Website Reseller License','Reserved for a future website reseller license.','draft');

-- This is intentionally DRAFT. Publishing real legal terms is an explicit admin action.
INSERT OR IGNORE INTO license_terms(id,license_type_id,version,terms_content,effective_at,status)
VALUES(
  'terms_content_mrr_draft_1',
  'license_type_content_mrr',
  'draft-1',
  'DRAFT ONLY. These are not operative commercial license terms. Replace with reviewed terms before activation is opened.',
  CURRENT_TIMESTAMP,
  'draft'
);

INSERT OR IGNORE INTO site_settings(key,value) VALUES('content_mrr_monthly_fee_cents','2500');
INSERT OR IGNORE INTO site_settings(key,value) VALUES('content_mrr_stripe_price_id','');

