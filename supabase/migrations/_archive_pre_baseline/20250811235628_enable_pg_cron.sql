-- Migration: Enable pg_cron extension
-- Purpose: Required for scheduling automated jobs (like Notion sync)
-- Author: Claude Code
-- Date: 2025-10-12

-- Enable pg_cron extension (for scheduled jobs)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA cron;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

COMMENT ON EXTENSION pg_cron IS
'PostgreSQL cron extension for scheduling jobs';
