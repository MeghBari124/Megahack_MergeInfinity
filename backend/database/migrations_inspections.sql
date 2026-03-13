-- Migration to add Field Inspection and Assignment capabilities

-- Add columns for field inspection workflow
ALTER TABLE claim_applications
ADD COLUMN IF NOT EXISTS assigned_inspector_id UUID NULL,
ADD COLUMN IF NOT EXISTS inspection_deadline TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN IF NOT EXISTS inspection_status TEXT DEFAULT 'pending', -- pending, scheduled, completed, report_submitted
ADD COLUMN IF NOT EXISTS inspection_report JSONB NULL, -- { visited_at, photos: [], loss_estimate, remarks }
ADD COLUMN IF NOT EXISTS official_pdf_url TEXT NULL; -- URL to the generated official PDF

-- Index for faster filtering by inspector
CREATE INDEX IF NOT EXISTS idx_claim_applications_inspector_id ON claim_applications(assigned_inspector_id);
