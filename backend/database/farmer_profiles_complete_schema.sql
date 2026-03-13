-- ====================================================
-- Complete Farmer Profiles Table Schema
-- Stores comprehensive farmer information for scheme applications
-- ====================================================

-- Create or update farmer_profiles table
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
    user_id TEXT NOT NULL PRIMARY KEY,
    
    -- Personal Details
    full_name TEXT NULL,
    father_husband_name TEXT NULL,
    date_of_birth DATE NULL,
    gender TEXT NULL,
    
    -- Contact Details
    mobile_number TEXT NULL,
    alternate_mobile TEXT NULL,
    email TEXT NULL,
    
    -- Identity Documents
    aadhaar_number TEXT NULL,
    pan_number TEXT NULL,
    voter_id TEXT NULL,
    
    -- Address Details
    address_line1 TEXT NULL,
    address_line2 TEXT NULL,
    village TEXT NULL,
    district TEXT NULL,
    state TEXT NULL,
    pincode TEXT NULL,
    
    -- Farm Details
    land_size DECIMAL(10,2) NULL,
    land_unit TEXT DEFAULT 'acres',
    survey_number TEXT NULL,
    land_ownership TEXT NULL, -- Owned/Leased/Shared
    
    -- Bank Details (for subsidy transfer)
    bank_name TEXT NULL,
    account_number TEXT NULL,
    ifsc_code TEXT NULL,
    branch_name TEXT NULL,
    
    -- Category & Eligibility
    category TEXT NULL, -- General/SC/ST/OBC/EWS
    farmer_type TEXT NULL, -- Marginal/Small/Medium/Large
    annual_income DECIMAL(12,2) NULL,
    
    -- NDVI Analysis & Crop Loss
    last_ndvi_value DECIMAL(5,3) NULL,
    crop_loss_percentage DECIMAL(5,2) NULL,
    last_ndvi_analysis_date TIMESTAMP NULL,
    
    -- Document URLs (stored in Supabase storage or cloud)
    aadhaar_doc_url TEXT NULL,
    land_doc_url TEXT NULL,
    bank_passbook_url TEXT NULL,
    photo_url TEXT NULL,
    
    -- Profile Status
    profile_completed BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================
-- Add columns if table already exists
-- ====================================================
DO $$ 
BEGIN
    -- Personal Details
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS father_husband_name TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS gender TEXT;
    
    -- Contact Details
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS mobile_number TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS alternate_mobile TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS email TEXT;
    
    -- Identity Documents
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS aadhaar_number TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS pan_number TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS voter_id TEXT;
    
    -- Address Details
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS address_line1 TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS address_line2 TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS village TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS district TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS pincode TEXT;
    
    -- Farm Details
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS survey_number TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS land_ownership TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS land_unit TEXT DEFAULT 'acres';
    
    -- Bank Details
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS account_number TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS branch_name TEXT;
    
    -- Category & Eligibility
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS farmer_type TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS annual_income DECIMAL(12,2);
    
    -- NDVI Analysis
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS last_ndvi_value DECIMAL(5,3);
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS crop_loss_percentage DECIMAL(5,2);
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS last_ndvi_analysis_date TIMESTAMP;
    
    -- Document URLs
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS aadhaar_doc_url TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS land_doc_url TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS bank_passbook_url TEXT;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
    
    -- Profile Status
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.farmer_profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
END $$;

-- ====================================================
-- INDEXES
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_mobile ON farmer_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_aadhaar ON farmer_profiles(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_state ON farmer_profiles(state);

-- ====================================================
-- COMMENTS
-- ====================================================
COMMENT ON TABLE farmer_profiles IS 'Comprehensive farmer profile data for claim applications';
COMMENT ON COLUMN farmer_profiles.last_ndvi_value IS 'Latest NDVI value from satellite analysis';
COMMENT ON COLUMN farmer_profiles.crop_loss_percentage IS 'Calculated crop loss % based on NDVI analysis';
