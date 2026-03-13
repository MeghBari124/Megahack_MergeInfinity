-- Create farmer_profiles table for Feature 4
CREATE TABLE IF NOT EXISTS public.farmer_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    phone TEXT,
    state TEXT NOT NULL,
    district TEXT,
    land_size NUMERIC,
    crops TEXT,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.farmer_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for demo purposes (CHANGE FOR PRODUCTION)
CREATE POLICY "Allow anon select farmer_profiles" ON public.farmer_profiles FOR SELECT USING (true);
CREATE POLICY "Allow anon insert farmer_profiles" ON public.farmer_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update farmer_profiles" ON public.farmer_profiles FOR UPDATE USING (true);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON public.farmer_profiles(user_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_farmer_profiles_updated_at ON public.farmer_profiles;
CREATE TRIGGER update_farmer_profiles_updated_at
    BEFORE UPDATE ON public.farmer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create scheme_applications table
CREATE TABLE IF NOT EXISTS public.scheme_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference_no TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES public.farmer_profiles(user_id),
    scheme_name TEXT NOT NULL,
    status TEXT DEFAULT 'submitted',
    application_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for scheme_applications
ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for demo purposes (CHANGE FOR PRODUCTION)
CREATE POLICY "Allow anon select scheme_applications" ON public.scheme_applications FOR SELECT USING (true);
CREATE POLICY "Allow anon insert scheme_applications" ON public.scheme_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update scheme_applications" ON public.scheme_applications FOR UPDATE USING (true);

-- Create index on user_id for scheme_applications
CREATE INDEX IF NOT EXISTS idx_scheme_applications_user_id ON public.scheme_applications(user_id);

-- Trigger for updated_at on scheme_applications
DROP TRIGGER IF EXISTS update_scheme_applications_updated_at ON public.scheme_applications;
CREATE TRIGGER update_scheme_applications_updated_at
    BEFORE UPDATE ON public.scheme_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
