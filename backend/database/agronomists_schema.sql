-- Agronomists Table Schema
-- This table stores expert agronomist contact information for farmer consultations

CREATE TABLE IF NOT EXISTS agronomists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    specialization VARCHAR(255) DEFAULT 'General Agriculture',
    experience_years INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_consultations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_agronomists_phone ON agronomists(phone);

-- Create index on availability for filtering
CREATE INDEX IF NOT EXISTS idx_agronomists_available ON agronomists(is_available);

-- Sample data insertion
INSERT INTO agronomists (name, phone, specialization, experience_years, is_available, rating) VALUES
('Dr. Shreedhar Khorate', '+919372491975', 'Crop Disease Management', 15, TRUE, 4.8),
('Dr. Dhruv Save', '+919579649407', 'Pest Control & IPM', 12, TRUE, 4.7),
('Dr. Samarth Bhirud', '+918408917498', 'Soil Health & Fertilization', 10, TRUE, 4.9),
('Dr. Neelay Joshi', '+917718883299', 'Organic Farming', 8, TRUE, 4.6)
ON CONFLICT (phone) DO NOTHING;

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_agronomists_updated_at
    BEFORE UPDATE ON agronomists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE agronomists ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read agronomist data
CREATE POLICY "Anyone can view agronomists"
    ON agronomists FOR SELECT
    TO anon, authenticated
    USING (TRUE);

-- Policy: Only authenticated users can update (for rating/consultation count)
CREATE POLICY "Authenticated users can update agronomists"
    ON agronomists FOR UPDATE
    TO authenticated
    USING (TRUE);
