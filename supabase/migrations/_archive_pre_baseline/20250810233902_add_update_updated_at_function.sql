-- Migration: Add missing update_updated_at_column function
-- Purpose: Helper function for automatic updated_at timestamp triggers
-- This function is used by multiple tables to auto-update the updated_at column
-- Author: Claude Code
-- Date: 2025-10-12

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_updated_at_column() IS
'Trigger function that automatically updates the updated_at column to current timestamp on row updates';
