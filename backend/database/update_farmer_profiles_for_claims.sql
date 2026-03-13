-- ====================================================
-- UPDATE EXISTING FARMER_PROFILES TABLE
-- Adds claim application fields to existing schema
-- Safe to run multiple times
-- ====================================================

-- Add Personal Details (for claims)
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT NULL,
ADD COLUMN IF NOT EXISTS father_husband_name TEXT NULL,
ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL,
ADD COLUMN IF NOT EXISTS gender TEXT NULL;

-- Add Contact Details
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS mobile_number TEXT NULL,
ADD COLUMN IF NOT EXISTS alternate_mobile TEXT NULL,
ADD COLUMN IF NOT EXISTS email TEXT NULL;

-- Add Identity Documents
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS aadhaar_number TEXT NULL,
ADD COLUMN IF NOT EXISTS pan_number TEXT NULL,
ADD COLUMN IF NOT EXISTS voter_id TEXT NULL;

-- Add Address Details (expand existing state/district)
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS address_line1 TEXT NULL,
ADD COLUMN IF NOT EXISTS address_line2 TEXT NULL,
ADD COLUMN IF NOT EXISTS village TEXT NULL,
ADD COLUMN IF NOT EXISTS pincode TEXT NULL;

-- Add Farm Details (expand existing)
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS land_unit TEXT DEFAULT 'acres',
ADD COLUMN IF NOT EXISTS survey_number TEXT NULL,
ADD COLUMN IF NOT EXISTS land_ownership TEXT NULL;

-- Add Bank Details (for subsidy/claim payment)
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT NULL,
ADD COLUMN IF NOT EXISTS account_number TEXT NULL,
ADD COLUMN IF NOT EXISTS ifsc_code TEXT NULL,
ADD COLUMN IF NOT EXISTS branch_name TEXT NULL;

-- Add Category & Eligibility (expand existing category)
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS farmer_type TEXT NULL,
ADD COLUMN IF NOT EXISTS annual_income DECIMAL(12,2) NULL;

-- Add NDVI Analysis & Crop Loss (CRITICAL for claims)
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS last_ndvi_value DECIMAL(5,3) NULL,
ADD COLUMN IF NOT EXISTS crop_loss_percentage DECIMAL(5,2) NULL,
ADD COLUMN IF NOT EXISTS last_ndvi_analysis_date TIMESTAMP NULL;

-- Add Document URLs (for uploaded documents)
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS aadhaar_doc_url TEXT NULL,
ADD COLUMN IF NOT EXISTS land_doc_url TEXT NULL,
ADD COLUMN IF NOT EXISTS bank_passbook_url TEXT NULL,
ADD COLUMN IF NOT EXISTS photo_url TEXT NULL;

-- Add Profile Status
ALTER TABLE public.farmer_profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- ====================================================
-- COPY EXISTING DATA TO NEW FIELDS
-- ====================================================

-- Copy existing 'name' to 'full_name' if full_name is empty
UPDATE public.farmer_profiles
SET full_name = name
WHERE full_name IS NULL AND name IS NOT NULL;

-- Copy existing 'phone' to 'mobile_number' if mobile_number is empty
UPDATE public.farmer_profiles
SET mobile_number = phone
WHERE mobile_number IS NULL AND phone IS NOT NULL;

-- Set profile_completed based on existing data completeness
UPDATE public.farmer_profiles
SET profile_completed = (
    name IS NOT NULL AND 
    phone IS NOT NULL AND 
    state IS NOT NULL
);

-- ====================================================
-- CREATE ADDITIONAL INDEXES
-- ====================================================
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_mobile ON farmer_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_aadhaar ON farmer_profiles(aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_state ON farmer_profiles(state);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_full_name ON farmer_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_verified ON farmer_profiles(verified);

-- ====================================================
-- UPDATE COMMENTS
-- ====================================================
COMMENT ON TABLE farmer_profiles IS 'Comprehensive farmer profile data for marketplace, claims, and scheme applications';
COMMENT ON COLUMN farmer_profiles.full_name IS 'Farmer full name (copied from name field)';
COMMENT ON COLUMN farmer_profiles.father_husband_name IS 'Father or husband name (required for government claims)';
COMMENT ON COLUMN farmer_profiles.aadhaar_number IS '12-digit Aadhaar number for identity verification';
COMMENT ON COLUMN farmer_profiles.last_ndvi_value IS 'Latest NDVI value from satellite analysis (0-1 range)';
COMMENT ON COLUMN farmer_profiles.crop_loss_percentage IS 'Calculated crop loss percentage based on NDVI analysis';
COMMENT ON COLUMN farmer_profiles.profile_completed IS 'True if farmer has completed all required profile fields';
COMMENT ON COLUMN farmer_profiles.verified IS 'True if admin has verified the farmer profile';

-- ====================================================
-- FIELD MAPPING REFERENCE
-- ====================================================
/*
OLD FIELD          → NEW FIELD             → PURPOSE
==================================================================================
name               → full_name             → Primary name field (copied)
phone              → mobile_number         → Primary mobile (copied)
state, district    → (kept + expanded)     → Location details
land_size          → (kept)                → Farm size
crops              → (kept)                → Crop types
category           → (kept)                → SC/ST/OBC/General
created_at         → (kept)                → Record creation
updated_at         → (kept)                → Last update
identity_verified  → (kept)                → Verification status
farm_geo_verified  → (kept)                → Farm location verified
reputation_rating  → (kept)                → Marketplace reputation

NEW FIELDS ADDED:
- father_husband_name    → Required for claims
- aadhaar_number         → Required for claims
- bank details           → Required for subsidy payment
- NDVI analysis          → Crop loss calculation
- document URLs          → Uploaded verification docs
- address details        → Complete address
- profile_completed      → Track completion status
*/

-- ====================================================
-- VERIFY UPDATES
-- ====================================================
-- Run this to check what was added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'farmer_profiles'
-- ORDER BY column_name;
