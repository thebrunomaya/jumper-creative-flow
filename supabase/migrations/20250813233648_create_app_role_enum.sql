-- Migration: Create app_role enum type
-- Purpose: Define user roles enum for the application
-- Author: Claude Code
-- Date: 2025-10-12

-- Create app_role enum type (admin, staff, client)
CREATE TYPE app_role AS ENUM ('admin', 'staff', 'client');

COMMENT ON TYPE app_role IS
'Application user roles: admin (full access), staff (Jumper team), client (marketing managers)';
