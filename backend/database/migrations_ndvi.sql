-- DATA MIGRATION FOR NDVI SYSTEM

-- 1. Crops Table (Tracks what is planted where)
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,          -- e.g., "Rice", "Wheat"
    variety TEXT,                -- e.g., "Sona Masoori"
    planting_date DATE NOT NULL,
    harvest_date_est DATE,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'HARVESTED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NDVI Records (Time-series data for analysis)
CREATE TABLE IF NOT EXISTS public.ndvi_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mean_ndvi NUMERIC NOT NULL,
    min_ndvi NUMERIC,
    max_ndvi NUMERIC,
    cloud_cover_percentage NUMERIC, -- Sentinel-2 metadata
    image_url TEXT,                 -- URL to stored heatmap overlay
    source TEXT DEFAULT 'Sentinel-2',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(land_id, date)           -- Prevent duplicate readings for same day
);

-- 3. Land Health Logs (Snapshots of stress analysis)
CREATE TABLE IF NOT EXISTS public.land_health_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    land_id UUID REFERENCES public.lands(id) ON DELETE CASCADE,
    check_date DATE DEFAULT CURRENT_DATE,
    risk_state TEXT NOT NULL CHECK (risk_state IN ('HEALTHY', 'EARLY_STRESS', 'SEVERE_STRESS', 'CROP_LOSS_LIKELY')),
    ndvi_baseline NUMERIC,         -- The expected value used for comparison
    ndvi_current NUMERIC,          -- The actual value observed
    stress_reason TEXT,            -- Generated explanation
    recommendation TEXT,           -- Actionable advice
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ndvi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.land_health_logs ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Development: Allow All)
CREATE POLICY "Allow all crops" ON public.crops FOR ALL USING (true);
CREATE POLICY "Allow all ndvi" ON public.ndvi_records FOR ALL USING (true);
CREATE POLICY "Allow all health" ON public.land_health_logs FOR ALL USING (true);
