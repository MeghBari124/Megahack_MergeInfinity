-- ====================================================
-- CLAIM APPLICATIONS TABLE SCHEMA
-- For managing crop loss insurance/subsidy claims
-- ====================================================

-- Drop existing table if needed (use with caution)
DROP TABLE IF EXISTS public.claim_applications CASCADE;

-- Create claim_applications table
CREATE TABLE public.claim_applications (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    reference_no TEXT NOT NULL,
    
    -- Farmer Identification
    user_id TEXT NOT NULL,
    farmer_name TEXT NULL,
    father_husband_name TEXT NULL,
    farmer_phone TEXT NULL,
    aadhaar_number TEXT NULL,
    
    -- Claim Details
    scheme_name TEXT NOT NULL,
    claim_type TEXT DEFAULT 'crop_loss', -- crop_loss, subsidy, insurance
    
    -- Farm & Loss Details
    land_size DECIMAL(10,2) NULL,
    land_unit TEXT DEFAULT 'acres',
    crop_name TEXT NULL,
    
    -- NDVI Analysis & Loss Calculation
    ndvi_value DECIMAL(5,3) NULL,
    crop_loss_percentage DECIMAL(5,2) NULL,
    loss_assessment_date TIMESTAMP NULL,
    
    -- Financial Details
    claim_amount DECIMAL(12,2) NULL,
    approved_amount DECIMAL(12,2) NULL,
    subsidy_percentage DECIMAL(5,2) NULL,
    
    -- Status & Workflow
    status TEXT NULL DEFAULT 'submitted', -- submitted, under_review, approved, rejected, completed
    priority TEXT DEFAULT 'normal', -- urgent, high, normal, low
    
    -- Additional Details (JSONB for flexibility)
    application_details JSONB NULL,
    loss_details JSONB NULL, -- Additional loss information from assessments
    
    -- Document Management
    document_urls JSONB NULL, -- {aadhaar_doc: url, land_doc: url, crop_photos: [urls], etc}
    
    -- Admin Management
    admin_notes TEXT NULL,
    reviewed_by TEXT NULL,
    reviewed_at TIMESTAMP NULL,
    approved_by TEXT NULL,
    approved_at TIMESTAMP NULL,
    
    -- Payment Tracking
    payment_status TEXT DEFAULT 'pending', -- pending, processed, completed
    payment_reference TEXT NULL,
    payment_date TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT claim_applications_pkey PRIMARY KEY (id),
    CONSTRAINT claim_applications_reference_no_key UNIQUE (reference_no)
);

-- ====================================================
-- INDEXES FOR PERFORMANCE
-- ====================================================
CREATE INDEX idx_claim_applications_user_id ON claim_applications(user_id);
CREATE INDEX idx_claim_applications_status ON claim_applications(status);
CREATE INDEX idx_claim_applications_created_at ON claim_applications(created_at);
CREATE INDEX idx_claim_applications_farmer_phone ON claim_applications(farmer_phone);
CREATE INDEX idx_claim_applications_aadhaar ON claim_applications(aadhaar_number);
CREATE INDEX idx_claim_applications_reference ON claim_applications(reference_no);
CREATE INDEX idx_claim_applications_claim_type ON claim_applications(claim_type);
CREATE INDEX idx_claim_applications_payment_status ON claim_applications(payment_status);

-- ====================================================
-- TRIGGER FOR UPDATED_AT
-- ====================================================
CREATE OR REPLACE FUNCTION update_claim_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_claim_applications_updated_at ON claim_applications;

CREATE TRIGGER trigger_update_claim_applications_updated_at
    BEFORE UPDATE ON claim_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_claim_applications_updated_at();

-- ====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================
ALTER TABLE claim_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow users to view own claims" ON claim_applications;
DROP POLICY IF EXISTS "Allow users to create claims" ON claim_applications;
DROP POLICY IF EXISTS "Allow service role full access" ON claim_applications;
DROP POLICY IF EXISTS "Allow public read for backend" ON claim_applications;

-- Policy: Users can view their own claims
CREATE POLICY "Allow users to view own claims"
    ON claim_applications
    FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Policy: Users can create their own claims
CREATE POLICY "Allow users to create claims"
    ON claim_applications
    FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'user_id');

-- Policy: Service role (backend) has full access
CREATE POLICY "Allow service role full access"
    ON claim_applications
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Policy: Allow anon/public role to read (for backend API)
CREATE POLICY "Allow public read for backend"
    ON claim_applications
    FOR SELECT
    USING (true);

-- ====================================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================================
COMMENT ON TABLE claim_applications IS 'Stores crop loss insurance and subsidy claim applications from farmers';
COMMENT ON COLUMN claim_applications.reference_no IS 'Unique claim reference number (e.g., CLM-2026-12345)';
COMMENT ON COLUMN claim_applications.ndvi_value IS 'Satellite-derived NDVI value for crop health assessment';
COMMENT ON COLUMN claim_applications.crop_loss_percentage IS 'Calculated crop loss percentage based on NDVI analysis';
COMMENT ON COLUMN claim_applications.claim_amount IS 'Farmer-requested claim amount';
COMMENT ON COLUMN claim_applications.approved_amount IS 'Admin-approved claim amount (may differ from requested)';
COMMENT ON COLUMN claim_applications.document_urls IS 'JSONB object storing URLs of uploaded documents';
COMMENT ON COLUMN claim_applications.application_details IS 'JSONB storing full application form data';
COMMENT ON COLUMN claim_applications.loss_details IS 'JSONB storing detailed loss assessment information';
COMMENT ON COLUMN claim_applications.payment_status IS 'Track payment processing: pending, processed, completed';

-- ====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- ====================================================
-- Uncomment to insert sample data
/*
INSERT INTO claim_applications (
    reference_no,
    user_id,
    farmer_name,
    father_husband_name,
    farmer_phone,
    aadhaar_number,
    scheme_name,
    land_size,
    crop_name,
    ndvi_value,
    crop_loss_percentage,
    claim_amount,
    status
) VALUES (
    'CLM-2026-00001',
    'test-farmer-1',
    'Ramesh Kumar',
    'Suresh Kumar',
    '9876543210',
    '123456789012',
    'PM Fasal Bima Yojana',
    5.5,
    'Wheat',
    0.42,
    35.50,
    75000.00,
    'submitted'
);
*/

-- ====================================================
-- GRANT PERMISSIONS
-- ====================================================
GRANT SELECT, INSERT, UPDATE ON claim_applications TO anon, authenticated;
GRANT ALL ON claim_applications TO service_role;
