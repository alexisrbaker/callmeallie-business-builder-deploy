ALTER TABLE affiliate_attributions ADD COLUMN user_id TEXT;
ALTER TABLE affiliate_attributions ADD COLUMN claimed_at TEXT;
ALTER TABLE affiliate_attributions ADD COLUMN last_seen_at TEXT;
CREATE INDEX IF NOT EXISTS idx_aff_attr_visitor ON affiliate_attributions(visitor_token);
CREATE INDEX IF NOT EXISTS idx_aff_attr_user ON affiliate_attributions(user_id);
CREATE INDEX IF NOT EXISTS idx_aff_attr_affiliate ON affiliate_attributions(affiliate_id);