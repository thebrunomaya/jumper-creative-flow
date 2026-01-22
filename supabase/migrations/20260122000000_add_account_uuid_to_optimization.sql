-- Migration: Add account_uuid column to optimization tables
-- Purpose: Migrate from TEXT notion_id to UUID for consistency with modern tables (j_hub_decks)
-- Strategy: Two-phase migration - this is Phase 1 (add columns, populate, no breaking changes)

-- ============================================================================
-- PHASE 1: ADD NEW COLUMNS (non-breaking)
-- ============================================================================

-- 1. Add account_uuid column to j_hub_optimization_recordings
ALTER TABLE "public"."j_hub_optimization_recordings"
ADD COLUMN IF NOT EXISTS "account_uuid" UUID;

-- 2. Add account_uuid column to j_hub_optimization_context
ALTER TABLE "public"."j_hub_optimization_context"
ADD COLUMN IF NOT EXISTS "account_uuid" UUID;

-- ============================================================================
-- PHASE 2: POPULATE NEW COLUMNS FROM EXISTING DATA
-- ============================================================================

-- 3. Populate account_uuid in recordings from notion_id join
UPDATE "public"."j_hub_optimization_recordings" r
SET "account_uuid" = a."id"
FROM "public"."j_hub_notion_db_accounts" a
WHERE r."account_id" = a."notion_id"
  AND r."account_uuid" IS NULL;

-- 4. Populate account_uuid in context from notion_id join
UPDATE "public"."j_hub_optimization_context" c
SET "account_uuid" = a."id"
FROM "public"."j_hub_notion_db_accounts" a
WHERE c."account_id" = a."notion_id"
  AND c."account_uuid" IS NULL;

-- ============================================================================
-- PHASE 3: ADD INDEXES FOR PERFORMANCE
-- ============================================================================

-- 5. Create index on new account_uuid column for recordings
CREATE INDEX IF NOT EXISTS "idx_recordings_account_uuid"
ON "public"."j_hub_optimization_recordings" ("account_uuid");

-- 6. Create index on new account_uuid column for context
CREATE INDEX IF NOT EXISTS "idx_context_account_uuid"
ON "public"."j_hub_optimization_context" ("account_uuid");

-- ============================================================================
-- PHASE 4: ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- 7. Add FK constraint for recordings (allow NULL during transition)
ALTER TABLE "public"."j_hub_optimization_recordings"
ADD CONSTRAINT "fk_optimization_recordings_account_uuid"
FOREIGN KEY ("account_uuid")
REFERENCES "public"."j_hub_notion_db_accounts"("id")
ON DELETE SET NULL;

-- 8. Add FK constraint for context (allow NULL during transition)
ALTER TABLE "public"."j_hub_optimization_context"
ADD CONSTRAINT "fk_optimization_context_account_uuid"
FOREIGN KEY ("account_uuid")
REFERENCES "public"."j_hub_notion_db_accounts"("id")
ON DELETE SET NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN "public"."j_hub_optimization_recordings"."account_uuid" IS
'UUID reference to j_hub_notion_db_accounts(id). Replaces legacy account_id (TEXT notion_id).';

COMMENT ON COLUMN "public"."j_hub_optimization_context"."account_uuid" IS
'UUID reference to j_hub_notion_db_accounts(id). Replaces legacy account_id (TEXT notion_id).';

-- ============================================================================
-- NOTE: Phase 2 migration (20260122000001_cleanup_optimization_account_id.sql)
-- will be created AFTER code is updated to use account_uuid. It will:
-- 1. Make account_uuid NOT NULL
-- 2. Drop the old account_id column
-- 3. Drop the old FK constraint
-- 4. Rename account_uuid to account_id (optional)
-- ============================================================================
