-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lands table
CREATE TABLE IF NOT EXISTS public.lands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    polygon_coordinates JSONB NOT NULL, -- Storing list of points [{'lat':..., 'lng':...}]
    area_sqm NUMERIC,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create land_documents table
CREATE TABLE IF NOT EXISTS public.land_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    extracted_area_sqm NUMERIC, -- From OCR
    confidence_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blockchain_events table
CREATE TABLE IF NOT EXISTS public.blockchain_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.land_documents(id) ON DELETE CASCADE,
    data_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Basic)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for demo purposes (CHANGE FOR PRODUCTION)
CREATE POLICY "Allow anon select users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anon insert users" ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon select lands" ON public.lands FOR SELECT USING (true);
CREATE POLICY "Allow anon insert lands" ON public.lands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update lands" ON public.lands FOR UPDATE USING (true);

CREATE POLICY "Allow anon select docs" ON public.land_documents FOR SELECT USING (true);
CREATE POLICY "Allow anon insert docs" ON public.land_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anon select events" ON public.blockchain_events FOR SELECT USING (true);
CREATE POLICY "Allow anon insert events" ON public.blockchain_events FOR INSERT WITH CHECK (true);
