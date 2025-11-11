-- Migration: Add 'general' to brand_identity constraint
-- Created: 2025-01-11
-- Description: Adds 'general' identity option for brand-neutral decks

BEGIN;

-- Drop existing CHECK constraint
ALTER TABLE j_hub_decks
DROP CONSTRAINT IF EXISTS j_hub_decks_brand_identity_check;

-- Add new CHECK constraint with 'general' option
ALTER TABLE j_hub_decks
ADD CONSTRAINT j_hub_decks_brand_identity_check
CHECK (brand_identity IN ('jumper', 'koko', 'tyaro', 'general'));

-- Add comment for documentation
COMMENT ON CONSTRAINT j_hub_decks_brand_identity_check ON j_hub_decks IS
  'Allowed brand identities: jumper (default), koko, tyaro, general (brand-neutral)';

COMMIT;
