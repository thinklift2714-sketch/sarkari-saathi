-- ========================================================
-- SARKARI SAATHI (सरकारी साथी) - SUPABASE POSTGRESQL SCHEMA
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    preferred_language VARCHAR(10) DEFAULT 'hi',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. FAMILY PROFILES TABLE
CREATE TABLE IF NOT EXISTS family_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20), -- 'महिला', 'पुरुष', 'अन्य'
    marital_status VARCHAR(50), -- 'विधवा', 'विवाहित', 'अविवाहित', 'तलाकशुदा'
    state VARCHAR(100) DEFAULT 'उत्तर प्रदेश',
    district VARCHAR(100) DEFAULT 'वाराणसी',
    village_or_town VARCHAR(255),
    occupation VARCHAR(100), -- 'किसान की विधवा', 'किसान', 'मजदूर', 'गृहिणी', 'छात्र', आदि
    annual_income NUMERIC(12, 2) DEFAULT 45000.00,
    family_size INTEGER DEFAULT 2,
    has_bank_account BOOLEAN DEFAULT TRUE,
    landholding NUMERIC(6, 2) DEFAULT 0.5, -- acres
    current_benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. FAMILY MEMBERS TABLE
CREATE TABLE IF NOT EXISTS family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL, -- 'मुख्य सदस्य', 'पुत्र', 'पुत्री', 'पति', 'पत्नी', आदि
    age INTEGER NOT NULL,
    occupation VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SCHEMES TABLE
CREATE TABLE IF NOT EXISTS schemes (
    id VARCHAR(100) PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL,
    scheme_name_hindi VARCHAR(255) NOT NULL,
    description TEXT,
    description_hindi TEXT NOT NULL,
    department VARCHAR(255) NOT NULL,
    department_hindi VARCHAR(255) NOT NULL,
    central_or_state VARCHAR(20) DEFAULT 'central', -- 'central' or 'state'
    applicable_states TEXT[] DEFAULT ARRAY['All']::TEXT[],
    benefits JSONB NOT NULL,
    eligibility_conditions JSONB NOT NULL,
    required_documents TEXT[] NOT NULL,
    optional_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
    application_steps JSONB NOT NULL,
    official_website VARCHAR(500) NOT NULL,
    official_source VARCHAR(500),
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 5. ELIGIBILITY RULES TABLE (Rule Engine storage)
CREATE TABLE IF NOT EXISTS eligibility_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id VARCHAR(100) REFERENCES schemes(id) ON DELETE CASCADE,
    rule_definition JSONB NOT NULL,
    rule_version VARCHAR(20) DEFAULT '1.0',
    source_reference VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. USER SCHEME RESULTS TABLE
CREATE TABLE IF NOT EXISTS user_scheme_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
    scheme_id VARCHAR(100) REFERENCES schemes(id) ON DELETE CASCADE,
    eligibility_status VARCHAR(50) NOT NULL, -- 'eligible', 'potentially_eligible', 'not_eligible'
    matched_conditions JSONB DEFAULT '[]'::JSONB,
    unmatched_conditions JSONB DEFAULT '[]'::JSONB,
    missing_information JSONB DEFAULT '[]'::JSONB,
    explanation TEXT,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(100) PRIMARY KEY,
    scheme_id VARCHAR(100) REFERENCES schemes(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_name_hindi VARCHAR(255) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    instructions TEXT,
    how_to_get TEXT
);

-- 8. USER DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
    document_name_hindi VARCHAR(255) NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'available', -- 'available', 'missing', 'uploaded'
    file_url VARCHAR(500),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_profile_id UUID REFERENCES family_profiles(id) ON DELETE CASCADE,
    scheme_id VARCHAR(100) REFERENCES schemes(id) ON DELETE CASCADE,
    application_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted_at_csc', 'in_review', 'approved'
    application_reference VARCHAR(100),
    applied_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_profiles_user_id ON family_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_schemes_active ON schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_user_scheme_results_profile ON user_scheme_results(family_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_profile ON user_documents(family_profile_id);

