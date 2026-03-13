-- Create table for Field Officers
CREATE TABLE IF NOT EXISTS public.field_officers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    officer_id TEXT UNIQUE NOT NULL, -- e.g. officer-001
    name TEXT NOT NULL,
    zone TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert seed data
INSERT INTO public.field_officers (officer_id, name, zone, email, phone)
VALUES 
    ('officer-001', 'Amit Verma', 'Zone A', 'amit@example.com', '9876543210'),
    ('officer-002', 'Priya Sharma', 'Zone B', 'priya@example.com', '9876543211'),
    ('officer-003', 'Rohit Singh', 'Zone C', 'rohit@example.com', '9876543212')
ON CONFLICT (officer_id) DO NOTHING;
