-- Migration: Cleanup - Remove legacy account_id (TEXT) from optimization tables
-- Purpose: Complete migration to UUID-only system
-- Prereq: 20260122000000_add_account_uuid_to_optimization.sql must be applied first

-- ============================================================================
-- PHASE 1: DROP OLD CONSTRAINTS
-- ============================================================================

-- Drop old FK constraint on recordings (if exists)
ALTER TABLE "public"."j_hub_optimization_recordings"
DROP CONSTRAINT IF EXISTS "j_hub_optimization_recordings_account_id_fkey";

-- Drop old FK constraint on context (if exists)
ALTER TABLE "public"."j_hub_optimization_context"
DROP CONSTRAINT IF EXISTS "j_hub_optimization_context_account_id_fkey";

-- ============================================================================
-- PHASE 2: DROP OLD COLUMNS
-- ============================================================================

-- Drop legacy account_id (TEXT) from recordings
ALTER TABLE "public"."j_hub_optimization_recordings"
DROP COLUMN IF EXISTS "account_id";

-- Drop legacy account_id (TEXT) from context
ALTER TABLE "public"."j_hub_optimization_context"
DROP COLUMN IF EXISTS "account_id";

-- ============================================================================
-- PHASE 3: RENAME account_uuid TO account_id
-- ============================================================================

-- Rename in recordings
ALTER TABLE "public"."j_hub_optimization_recordings"
RENAME COLUMN "account_uuid" TO "account_id";

-- Rename in context
ALTER TABLE "public"."j_hub_optimization_context"
RENAME COLUMN "account_uuid" TO "account_id";

-- ============================================================================
-- PHASE 4: MAKE NOT NULL
-- ============================================================================

-- Make account_id NOT NULL in recordings
ALTER TABLE "public"."j_hub_optimization_recordings"
ALTER COLUMN "account_id" SET NOT NULL;

-- Make account_id NOT NULL in context
ALTER TABLE "public"."j_hub_optimization_context"
ALTER COLUMN "account_id" SET NOT NULL;

-- ============================================================================
-- PHASE 5: RENAME INDEXES AND CONSTRAINTS
-- ============================================================================

-- Rename index on recordings
ALTER INDEX IF EXISTS "idx_recordings_account_uuid"
RENAME TO "idx_recordings_account_id";

-- Rename index on context
ALTER INDEX IF EXISTS "idx_context_account_uuid"
RENAME TO "idx_context_account_id";

-- Rename FK constraint on recordings
ALTER TABLE "public"."j_hub_optimization_recordings"
DROP CONSTRAINT IF EXISTS "fk_optimization_recordings_account_uuid";

ALTER TABLE "public"."j_hub_optimization_recordings"
ADD CONSTRAINT "fk_optimization_recordings_account_id"
FOREIGN KEY ("account_id")
REFERENCES "public"."j_hub_notion_db_accounts"("id")
ON DELETE CASCADE;

-- Rename FK constraint on context
ALTER TABLE "public"."j_hub_optimization_context"
DROP CONSTRAINT IF EXISTS "fk_optimization_context_account_uuid";

ALTER TABLE "public"."j_hub_optimization_context"
ADD CONSTRAINT "fk_optimization_context_account_id"
FOREIGN KEY ("account_id")
REFERENCES "public"."j_hub_notion_db_accounts"("id")
ON DELETE CASCADE;

-- ============================================================================
-- PHASE 6: UPDATE COMMENTS
-- ============================================================================

COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."account_id" IS
'UUID reference to j_hub_notion_db_accounts(id). Primary account identifier.';

COMMENT ON COLUMN "public"."j_hub_optimization_context"."account_id" IS
'UUID reference to j_hub_notion_db_accounts(id). Primary account identifier.';

-- ============================================================================
-- DONE: Now account_id is UUID everywhere, no more TEXT notion_id
-- ============================================================================
