-- Install Sessions Tabelle für pending Shopify Installationen
-- WICHTIG: OAuth Code wird SOFORT gegen Access Token getauscht
-- Access Token wird hier gespeichert bis User eingeloggt ist

CREATE TABLE IF NOT EXISTS install_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain VARCHAR(255) NOT NULL,
  shop_id VARCHAR(255),
  access_token TEXT NOT NULL,
  scope TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_auth',
  selected_plan VARCHAR(50) DEFAULT 'free',
  clerk_user_id VARCHAR(255),
  org_id UUID,
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_install_sessions_status ON install_sessions(status);
CREATE INDEX IF NOT EXISTS idx_install_sessions_shop ON install_sessions(shop_domain);
CREATE INDEX IF NOT EXISTS idx_install_sessions_expires ON install_sessions(expires_at);

-- Füge subscription Felder zu shopify_shops hinzu falls nicht vorhanden
ALTER TABLE shopify_shops ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE shopify_shops ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP;
ALTER TABLE shopify_shops ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP;
ALTER TABLE shopify_shops ADD COLUMN IF NOT EXISTS shopify_charge_id VARCHAR(255);
