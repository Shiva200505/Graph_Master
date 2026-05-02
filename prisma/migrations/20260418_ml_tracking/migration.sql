-- Migration: ml_tracking
-- Adds recommendation_events and product_associations tables

-- Table 1: Track implicit signals (views, cart adds)
CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(20) NOT NULL, -- 'view', 'cart_add', 'cart_remove', 'purchase'
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),         -- for anonymous users
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES dealers(id) ON DELETE SET NULL,
  user_lat DECIMAL(10, 7),
  user_lng DECIMAL(10, 7),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_events_product ON recommendation_events(product_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_user ON recommendation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_session ON recommendation_events(session_id);
CREATE INDEX IF NOT EXISTS idx_rec_events_type ON recommendation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_rec_events_created ON recommendation_events(created_at DESC);

-- Table 2: Pre-computed "frequently bought together" pairs (refreshed daily)
CREATE TABLE IF NOT EXISTS product_associations (
  product_a UUID REFERENCES products(id) ON DELETE CASCADE,
  product_b UUID REFERENCES products(id) ON DELETE CASCADE,
  co_occurrence_count INTEGER DEFAULT 0,
  confidence DECIMAL(5,4) DEFAULT 0,  -- P(B | A) = orders_with_both / orders_with_A
  lift DECIMAL(8,4) DEFAULT 0,        -- confidence / P(B)
  last_computed TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (product_a, product_b)
);

CREATE INDEX IF NOT EXISTS idx_assoc_product_a ON product_associations(product_a);
CREATE INDEX IF NOT EXISTS idx_assoc_lift ON product_associations(product_a, lift DESC);
