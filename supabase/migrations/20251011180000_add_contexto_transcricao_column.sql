-- Add "Contexto para Transcrição" column to Notion sync table
-- This column stores summarized context specifically for audio transcription (Whisper)
-- Different from "Contexto para Otimização" which stores full context for analysis steps

ALTER TABLE j_ads_notion_db_accounts
ADD COLUMN IF NOT EXISTS "Contexto para Transcrição" TEXT;

-- Add index for query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_notion_accounts_contexto_transcricao
ON j_ads_notion_db_accounts("Contexto para Transcrição");

-- Add comment explaining the column purpose
COMMENT ON COLUMN j_ads_notion_db_accounts."Contexto para Transcrição" IS
'Summarized context for audio transcription (Whisper API). Used in Step 1 only. For full context, use "Contexto para Otimização".';
