-- Create autonomous_sensors table for hardware data
CREATE TABLE IF NOT EXISTS public.autonomous_sensors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create autonomous_ledger table for blockchain logging
CREATE TABLE IF NOT EXISTS public.autonomous_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hash TEXT NOT NULL,
    user_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL,
    previous_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.autonomous_sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autonomous_ledger ENABLE ROW LEVEL SECURITY;

-- Allow all access (for development)
CREATE POLICY "Allow all autonomous_sensors" ON public.autonomous_sensors FOR ALL USING (true);
CREATE POLICY "Allow all autonomous_ledger" ON public.autonomous_ledger FOR ALL USING (true);
