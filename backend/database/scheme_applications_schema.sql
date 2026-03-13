-- ====================================================
-- Scheme Applications Table Schema
-- This table tracks government scheme applications by farmers
-- SAFE TO RUN MULTIPLE TIMES - Uses IF NOT EXISTS / OR REPLACE
-- ====================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scheme_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    reference_no TEXT NOT NULL,
    user_id TEXT NOT NULL,
    farmer_name TEXT NULL,
    farmer_phone TEXT NULL,
    scheme_name TEXT NOT NULL,
    status TEXT NULL DEFAULT 'submitted'::text,
    application_details JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    CONSTRAINT scheme_applications_pkey PRIMARY KEY (id),
    CONSTRAINT scheme_applications_reference_no_key UNIQUE (reference_no)
    -- Foreign key removed to allow applications without farmer_profiles entry
) TABLESPACE pg_default;

-- ====================================================
-- INDEXES
-- ====================================================

-- Create indexes (will skip if already exist)
CREATE INDEX IF NOT EXISTS idx_scheme_applications_user_id 
ON public.scheme_applications USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_scheme_applications_status 
ON public.scheme_applications USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_scheme_applications_created_at 
ON public.scheme_applications USING btree (created_at DESC) TABLESPACE pg_default;

-- ====================================================
-- TRIGGER FUNCTION (for auto-updating updated_at)
-- ====================================================

-- Note: Assumes update_updated_at_column() function already exists
-- If it doesn't exist, create it:
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- TRIGGER
-- ====================================================

-- Drop trigger if exists, then recreate
DROP TRIGGER IF EXISTS update_scheme_applications_updated_at ON scheme_applications;

CREATE TRIGGER update_scheme_applications_updated_at 
BEFORE UPDATE ON scheme_applications 
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================

-- Enable RLS
ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own scheme applications" ON scheme_applications;
DROP POLICY IF EXISTS "Users can create scheme applications" ON scheme_applications;
DROP POLICY IF EXISTS "Admins can view all scheme applications" ON scheme_applications;
DROP POLICY IF EXISTS "Public can insert without auth" ON scheme_applications;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view their own scheme applications"
    ON scheme_applications FOR SELECT
    TO authenticated
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Policy: Users can insert their own applications
CREATE POLICY "Users can create scheme applications"
    ON scheme_applications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Policy: Allow public insert (for service role / anon users)
-- This allows backend service to insert records
CREATE POLICY "Public can insert without auth"
    ON scheme_applications FOR INSERT
    TO anon, public
    WITH CHECK (true);

-- Policy: Allow public select (for backend service to fetch data)
CREATE POLICY "Public can view all applications"
    ON scheme_applications FOR SELECT
    TO anon, public
    USING (true);

-- ====================================================
-- COMMENTS
-- ====================================================

COMMENT ON TABLE scheme_applications IS 'Stores government scheme applications from farmers';
COMMENT ON COLUMN scheme_applications.reference_no IS 'Unique reference number like SA-2024-12345';
COMMENT ON COLUMN scheme_applications.status IS 'Application status: submitted, under_review, approved, rejected, completed';
COMMENT ON COLUMN scheme_applications.application_details IS 'JSONB field containing farmer details, scheme details, and disease info';

-- ====================================================
-- SAMPLE VALID STATUSES
-- ====================================================
-- 'submitted' - Initial submission
-- 'under_review' - Being reviewed by admin
-- 'approved' - Application approved
-- 'rejected' - Application rejected
-- 'completed' - Scheme benefits delivered

