-- Create error tracking system for admin monitoring
-- This allows the system to log all errors for admin review while keeping submissions working

-- Error logs table for tracking all system errors
CREATE TABLE IF NOT EXISTS j_ads_error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Error classification
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    category TEXT NOT NULL CHECK (category IN ('validation', 'network', 'external_api', 'file_upload', 'database', 'unknown')) DEFAULT 'unknown',
    context TEXT NOT NULL, -- e.g., 'notion_api_failure', 'file_upload_error', 'validation_error'
    
    -- Error details
    operation TEXT NOT NULL, -- e.g., 'createNotionPage', 'uploadFile', 'validateSubmission'
    error_message TEXT NOT NULL,
    error_code TEXT, -- HTTP status code or custom error code
    error_stack TEXT, -- Stack trace if available
    error_details JSONB, -- Additional structured error data
    
    -- Request/submission context
    submission_id UUID REFERENCES j_ads_creative_submissions(id),
    manager_id UUID REFERENCES auth.users(id),
    user_agent TEXT,
    ip_address INET,
    
    -- System state
    system_health JSONB, -- Health check results at time of error
    retry_count INTEGER DEFAULT 0,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Admin tracking
    admin_notified BOOLEAN DEFAULT FALSE,
    admin_viewed BOOLEAN DEFAULT FALSE,
    admin_notes TEXT
);

-- Indexes for efficient querying (only create if columns exist)
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON j_ads_error_logs(created_at DESC);

DO $$
BEGIN
  -- Create indexes only if the columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'j_ads_error_logs' AND column_name = 'severity') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON j_ads_error_logs(severity);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'j_ads_error_logs' AND column_name = 'category') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_category ON j_ads_error_logs(category);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'j_ads_error_logs' AND column_name = 'context') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_context ON j_ads_error_logs(context);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'j_ads_error_logs' AND column_name = 'submission_id') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_submission_id ON j_ads_error_logs(submission_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'j_ads_error_logs' AND column_name = 'manager_id') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_manager_id ON j_ads_error_logs(manager_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'j_ads_error_logs' AND column_name = 'resolved_at') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON j_ads_error_logs(created_at DESC) WHERE resolved_at IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'j_ads_error_logs' AND column_name = 'admin_viewed') THEN
    CREATE INDEX IF NOT EXISTS idx_error_logs_admin_review ON j_ads_error_logs(created_at DESC) WHERE admin_viewed = FALSE;
  END IF;
END $$;

-- System metrics table for tracking overall health
CREATE TABLE IF NOT EXISTS j_ads_system_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Health metrics
    supabase_healthy BOOLEAN DEFAULT TRUE,
    supabase_response_time INTEGER, -- milliseconds
    edge_functions_healthy BOOLEAN DEFAULT TRUE,
    edge_functions_response_time INTEGER,
    storage_healthy BOOLEAN DEFAULT TRUE,
    storage_response_time INTEGER,
    notion_api_healthy BOOLEAN DEFAULT TRUE,
    notion_api_response_time INTEGER,
    
    -- Usage metrics
    submissions_count_24h INTEGER DEFAULT 0,
    error_count_24h INTEGER DEFAULT 0,
    avg_submission_time INTEGER, -- milliseconds
    
    -- System info
    active_users_count INTEGER DEFAULT 0,
    storage_usage_mb NUMERIC(10, 2),
    
    -- Overall health score (0-100)
    health_score INTEGER DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100)
);

-- Index for metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON j_ads_system_metrics(recorded_at DESC);

-- Fallback submissions table for when Notion API fails
CREATE TABLE IF NOT EXISTS j_ads_fallback_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Original submission reference
    submission_id UUID REFERENCES j_ads_creative_submissions(id),
    
    -- Fallback reason
    fallback_reason TEXT NOT NULL, -- e.g., 'notion_api_unavailable', 'notion_rate_limited'
    original_error JSONB, -- The error that caused the fallback
    
    -- Data that needs to be synced to Notion
    notion_payload JSONB NOT NULL,
    uploaded_files JSONB NOT NULL, -- File URLs and metadata
    
    -- Sync status
    sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
    sync_attempts INTEGER DEFAULT 0,
    last_sync_attempt TIMESTAMP WITH TIME ZONE,
    last_sync_error TEXT,
    notion_page_id TEXT, -- Set when successfully synced
    
    -- Admin tracking
    admin_notified BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5) -- 1 = highest priority
);

-- Indexes for fallback submissions
CREATE INDEX IF NOT EXISTS idx_fallback_submissions_sync_status ON j_ads_fallback_submissions(sync_status);
CREATE INDEX IF NOT EXISTS idx_fallback_submissions_priority ON j_ads_fallback_submissions(priority, created_at);
CREATE INDEX IF NOT EXISTS idx_fallback_submissions_pending ON j_ads_fallback_submissions(created_at) WHERE sync_status = 'pending';

-- RLS Policies

-- Error logs: Only admins can view all, managers can view their own
ALTER TABLE j_ads_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all error logs" ON j_ads_error_logs
    FOR SELECT USING (has_role('admin'));

CREATE POLICY "Managers can view their own error logs" ON j_ads_error_logs
    FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "System can insert error logs" ON j_ads_error_logs
    FOR INSERT WITH CHECK (true);

-- System metrics: Only admins can view
ALTER TABLE j_ads_system_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system metrics" ON j_ads_system_metrics
    FOR SELECT USING (has_role('admin'));

CREATE POLICY "System can insert metrics" ON j_ads_system_metrics
    FOR INSERT WITH CHECK (true);

-- Fallback submissions: Only admins can view
ALTER TABLE j_ads_fallback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fallback submissions" ON j_ads_fallback_submissions
    FOR SELECT USING (has_role('admin'));

CREATE POLICY "Admins can update fallback submissions" ON j_ads_fallback_submissions
    FOR UPDATE USING (has_role('admin'));

CREATE POLICY "System can insert fallback submissions" ON j_ads_fallback_submissions
    FOR INSERT WITH CHECK (true);

-- Helper function to log errors from edge functions
CREATE OR REPLACE FUNCTION log_system_error(
    p_severity TEXT,
    p_category TEXT,
    p_context TEXT,
    p_operation TEXT,
    p_error_message TEXT,
    p_error_code TEXT DEFAULT NULL,
    p_error_stack TEXT DEFAULT NULL,
    p_error_details JSONB DEFAULT NULL,
    p_submission_id UUID DEFAULT NULL,
    p_manager_id UUID DEFAULT NULL,
    p_system_health JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    error_id UUID;
BEGIN
    INSERT INTO j_ads_error_logs (
        severity, category, context, operation, error_message,
        error_code, error_stack, error_details, submission_id,
        manager_id, system_health
    ) VALUES (
        p_severity, p_category, p_context, p_operation, p_error_message,
        p_error_code, p_error_stack, p_error_details, p_submission_id,
        p_manager_id, p_system_health
    ) RETURNING id INTO error_id;
    
    RETURN error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to record system metrics
CREATE OR REPLACE FUNCTION record_system_metrics(
    p_supabase_healthy BOOLEAN DEFAULT TRUE,
    p_supabase_response_time INTEGER DEFAULT NULL,
    p_edge_functions_healthy BOOLEAN DEFAULT TRUE,
    p_edge_functions_response_time INTEGER DEFAULT NULL,
    p_storage_healthy BOOLEAN DEFAULT TRUE,
    p_storage_response_time INTEGER DEFAULT NULL,
    p_notion_api_healthy BOOLEAN DEFAULT TRUE,
    p_notion_api_response_time INTEGER DEFAULT NULL,
    p_health_score INTEGER DEFAULT 100
) RETURNS UUID AS $$
DECLARE
    metrics_id UUID;
    submissions_24h INTEGER;
    errors_24h INTEGER;
BEGIN
    -- Calculate 24h metrics
    SELECT COUNT(*) INTO submissions_24h
    FROM j_ads_creative_submissions
    WHERE created_at > NOW() - INTERVAL '24 hours';
    
    SELECT COUNT(*) INTO errors_24h
    FROM j_ads_error_logs
    WHERE created_at > NOW() - INTERVAL '24 hours';
    
    INSERT INTO j_ads_system_metrics (
        supabase_healthy, supabase_response_time,
        edge_functions_healthy, edge_functions_response_time,
        storage_healthy, storage_response_time,
        notion_api_healthy, notion_api_response_time,
        submissions_count_24h, error_count_24h, health_score
    ) VALUES (
        p_supabase_healthy, p_supabase_response_time,
        p_edge_functions_healthy, p_edge_functions_response_time,
        p_storage_healthy, p_storage_response_time,
        p_notion_api_healthy, p_notion_api_response_time,
        submissions_24h, errors_24h, p_health_score
    ) RETURNING id INTO metrics_id;
    
    RETURN metrics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old records to prevent table bloat
CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
BEGIN
    -- Keep error logs for 30 days, except critical ones (keep for 90 days)
    DELETE FROM j_ads_error_logs 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND severity != 'critical';
    
    DELETE FROM j_ads_error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Keep metrics for 7 days
    DELETE FROM j_ads_system_metrics 
    WHERE recorded_at < NOW() - INTERVAL '7 days';
    
    -- Clean up resolved fallback submissions older than 7 days
    DELETE FROM j_ads_fallback_submissions 
    WHERE sync_status = 'completed' 
    AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup to run daily (if pg_cron extension is available)
-- SELECT cron.schedule('cleanup-old-logs', '0 2 * * *', 'SELECT cleanup_old_logs();');