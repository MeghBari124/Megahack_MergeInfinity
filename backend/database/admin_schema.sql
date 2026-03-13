-- Admin & Claims Management Schema

-- 1. Claims Table
CREATE TABLE IF NOT EXISTS public.claims (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    farmer_id UUID REFERENCES public.users(id), -- Assuming users table holds farmer auth
    farmer_name TEXT NOT NULL,
    farm_id TEXT, -- Can link to a 'lands' table if strictly enforced
    crop_type TEXT NOT NULL,
    estimated_loss_percentage NUMERIC,
    claim_amount_requested NUMERIC,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    ndvi_confidence_score NUMERIC, -- AI Generated score
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Needs Verification', 'Approved', 'Rejected')),
    rejection_reason TEXT,
    evidence_urls JSONB, -- Array of image/video URLs
    
    -- For Digital Signature
    is_signed BOOLEAN DEFAULT FALSE,
    digital_signature_hash TEXT,
    signed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Field Officer Assignments
CREATE TABLE IF NOT EXISTS public.field_officer_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    claim_id UUID REFERENCES public.claims(id) ON DELETE CASCADE,
    officer_name TEXT NOT NULL, -- In a real system, this would be a user_id
    officer_contact TEXT,
    assignment_date TIMESTAMPTZ DEFAULT NOW(),
    visit_deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'Assigned' CHECK (status IN ('Assigned', 'Visited', 'Report Submitted')),
    
    -- Report Details
    report_loss_estimate NUMERIC,
    report_remarks TEXT,
    report_evidence_urls JSONB, -- Geo-tagged photos uploaded by officer
    report_submitted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Broadcasts / Alerts
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.users(id), -- Admin who sent it
    message TEXT NOT NULL,
    region TEXT, -- 'All' or specific region/district
    alert_type TEXT DEFAULT 'General' CHECK (alert_type IN ('General', 'Weather', 'Emergency', 'Deadline')),
    channels JSONB, -- ['SMS', 'App', 'Email']
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_officer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for prototype, refine for production)
CREATE POLICY "Enable read/write for all on claims" ON public.claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for all on assignments" ON public.field_officer_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for all on broadcasts" ON public.broadcasts FOR ALL USING (true) WITH CHECK (true);
