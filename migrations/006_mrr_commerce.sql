PRAGMA foreign_keys = ON;

-- The MRR package purchase and the continuing commercial license are separate things.
-- A package purchase grants the buyer the files plus personal Business Builder access.
-- Commercial resale rights become active only through a license record.
ALTER TABLE orders ADD COLUMN originating_seller_user_id TEXT;
ALTER TABLE orders ADD COLUMN provider_checkout_session_id TEXT;
ALTER TABLE orders ADD COLUMN metadata_json TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_checkout
  ON orders(provider, provider_checkout_session_id)
  WHERE provider_checkout_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS product_entitlement_rules(
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  entitlement_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE(product_id, entitlement_key),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS mrr_package_purchases(
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  buyer_user_id TEXT NOT NULL,
  originating_seller_user_id TEXT,
  package_key TEXT NOT NULL DEFAULT 'business_builder_content_mrr',
  package_version TEXT,
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(buyer_user_id) REFERENCES users(id),
  FOREIGN KEY(originating_seller_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_mrr_package_buyer ON mrr_package_purchases(buyer_user_id,status);
CREATE INDEX IF NOT EXISTS idx_mrr_package_seller ON mrr_package_purchases(originating_seller_user_id,status);

INSERT OR IGNORE INTO products(id,slug,name,product_type,status,price_cents,currency)
VALUES('product_business_builder','business-builder','Business Builder Library','digital_library','active',4600,'usd');

INSERT OR IGNORE INTO products(id,slug,name,product_type,status,price_cents,currency)
VALUES('product_business_builder_mrr','business-builder-mrr','Business Builder Master Resell Rights','licensed_digital_package','active',46000,'usd');

INSERT OR IGNORE INTO product_entitlement_rules(id,product_id,entitlement_key)
VALUES('rule_builder_library','product_business_builder','business_builder_library');

-- Buying MRR also gives the buyer the convenient hosted library for personal use.
INSERT OR IGNORE INTO product_entitlement_rules(id,product_id,entitlement_key)
VALUES('rule_mrr_library','product_business_builder_mrr','business_builder_library');

INSERT OR IGNORE INTO product_entitlement_rules(id,product_id,entitlement_key)
VALUES('rule_mrr_package','product_business_builder_mrr','business_builder_mrr_package');

