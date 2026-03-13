-- MASTER SCHEMA FOR LET GO 3.0
-- Run this in Supabase SQL Editor to reset and initialize the entire database.

-- ==========================================
-- 1. CLEANUP (Drop valid tables to reset)
-- ==========================================
DROP TABLE IF EXISTS blockchain_events CASCADE;
DROP TABLE IF EXISTS land_documents CASCADE;
DROP TABLE IF EXISTS lands CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop legacy tables if they exist
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS auth_users CASCADE;
DROP TABLE IF EXISTS authentication_logs CASCADE;
DROP TABLE IF EXISTS farm_logs CASCADE;
DROP TABLE IF EXISTS user_activity_logs CASCADE;

-- ==========================================
-- 2. CORE AUTHENTICATION (Users & Sessions)
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20), -- Optional now
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer', 'user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. FEATURE SPECIFIC TABLES
-- ==========================================

-- Feature 6: Mark My Land
CREATE TABLE lands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    polygon_coordinates JSONB NOT NULL,
    area_sqm NUMERIC,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE land_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    land_id UUID REFERENCES lands(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    extracted_area_sqm NUMERIC,
    confidence_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE blockchain_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    land_id UUID REFERENCES lands(id) ON DELETE CASCADE,
    document_id UUID REFERENCES land_documents(id) ON DELETE CASCADE,
    data_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. UTILITIES & TRIGGERS
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lands_updated_at BEFORE UPDATE ON lands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lands ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (Development Mode)
CREATE POLICY "Public Users Access" ON users FOR ALL USING (true);
CREATE POLICY "Public Sessions Access" ON sessions FOR ALL USING (true);
CREATE POLICY "Public Lands Access" ON lands FOR ALL USING (true);
