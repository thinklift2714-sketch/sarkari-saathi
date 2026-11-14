-- ====================================================================
-- SARKARI SAATHI (सरकारी साथी) - SUPABASE POSTGRESQL MIGRATION & RLS
-- Complete User Authentication, Data Isolation & Row Level Security
-- ====================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. PUBLIC SCHEMES CATALOG (Public Government Data)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.schemes (
    id VARCHAR(100) PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL,
    scheme_name_hindi VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    category_hindi VARCHAR(100) NOT NULL,
    description TEXT,
    description_hindi TEXT NOT NULL,
    department VARCHAR(255) NOT NULL,
    department_hindi VARCHAR(255) NOT NULL,
    ministry VARCHAR(255),
    ministry_hindi VARCHAR(255),
    central_or_state VARCHAR(20) DEFAULT 'central',
    applicable_states TEXT[] DEFAULT ARRAY['All']::TEXT[],
    beneficiary_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    benefits JSONB NOT NULL DEFAULT '{}'::JSONB,
    eligibility_conditions JSONB NOT NULL DEFAULT '{}'::JSONB,
    required_documents TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    optional_documents TEXT[] DEFAULT ARRAY[]::TEXT[],
    application_steps JSONB NOT NULL DEFAULT '[]'::JSONB,
    official_website VARCHAR(500) NOT NULL,
    official_source VARCHAR(500),
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schemes table is public read-only
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public schemes are viewable by everyone" ON public.schemes;
CREATE POLICY "Public schemes are viewable by everyone"
    ON public.schemes FOR SELECT
    USING (true);


-- ====================================================================
-- 3. PROFILES TABLE (Linked 1:1 to auth.users)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone_number VARCHAR(20),
    avatar_url TEXT,
    preferred_language VARCHAR(10) DEFAULT 'hi',
    theme_preference VARCHAR(20) DEFAULT 'light',
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure avatar_url exists if table was already created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
    ON public.profiles FOR DELETE
    USING (auth.uid() = id);


-- ====================================================================
-- 4. FAMILY PROFILES TABLE (User's Demographics & Eligibility Factors)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.family_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age INTEGER,
    gender VARCHAR(20),
    marital_status VARCHAR(50),
    state VARCHAR(100) DEFAULT 'उत्तर प्रदेश',
    district VARCHAR(100),
    village_or_town VARCHAR(255),
    occupation VARCHAR(100),
    annual_income NUMERIC(12, 2) DEFAULT 0.00,
    family_size INTEGER DEFAULT 1,
    has_bank_account BOOLEAN DEFAULT TRUE,
    landholding NUMERIC(6, 2) DEFAULT 0.0,
    caste_category VARCHAR(100),
    is_student BOOLEAN DEFAULT FALSE,
    has_disability BOOLEAN DEFAULT FALSE,
    current_benefits TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_family_profiles_user UNIQUE (user_id)
);

-- Ensure extended onboarding columns exist
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12, 2);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS owns_agricultural_land BOOLEAN DEFAULT FALSE;
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS is_bpl BOOLEAN DEFAULT FALSE;
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS education_level VARCHAR(100);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS education_status VARCHAR(100);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS course_or_degree VARCHAR(100);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS institution_type VARCHAR(100);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS academic_marks NUMERIC(5, 2);
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS has_aadhaar BOOLEAN DEFAULT FALSE;
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS has_income_certificate BOOLEAN DEFAULT FALSE;
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS has_domicile_certificate BOOLEAN DEFAULT FALSE;
ALTER TABLE public.family_profiles ADD COLUMN IF NOT EXISTS has_ration_card BOOLEAN DEFAULT FALSE;

ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own family profile" ON public.family_profiles;
CREATE POLICY "Users can view their own family profile"
    ON public.family_profiles FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own family profile" ON public.family_profiles;
CREATE POLICY "Users can insert their own family profile"
    ON public.family_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own family profile" ON public.family_profiles;
CREATE POLICY "Users can update their own family profile"
    ON public.family_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own family profile" ON public.family_profiles;
CREATE POLICY "Users can delete their own family profile"
    ON public.family_profiles FOR DELETE
    USING (auth.uid() = user_id);


-- ====================================================================
-- 5. FAMILY MEMBERS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    family_profile_id UUID REFERENCES public.family_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    age INTEGER NOT NULL,
    occupation VARCHAR(100),
    education VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own family members" ON public.family_members;
CREATE POLICY "Users can view their own family members"
    ON public.family_members FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own family members" ON public.family_members;
CREATE POLICY "Users can insert their own family members"
    ON public.family_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own family members" ON public.family_members;
CREATE POLICY "Users can update their own family members"
    ON public.family_members FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own family members" ON public.family_members;
CREATE POLICY "Users can delete their own family members"
    ON public.family_members FOR DELETE
    USING (auth.uid() = user_id);


-- ====================================================================
-- 6. USER DOCUMENTS TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500),
    availability_status VARCHAR(50) DEFAULT 'missing', -- 'available' | 'missing' | 'uploaded'
    verification_status VARCHAR(50) DEFAULT 'unverified', -- 'unverified' | 'verified' | 'pending'
    file_type VARCHAR(50),
    file_size_bytes BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_document UNIQUE (user_id, document_name)
);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own documents" ON public.user_documents;
CREATE POLICY "Users can view their own documents"
    ON public.user_documents FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own documents" ON public.user_documents;
CREATE POLICY "Users can insert their own documents"
    ON public.user_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own documents" ON public.user_documents;
CREATE POLICY "Users can update their own documents"
    ON public.user_documents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own documents" ON public.user_documents;
CREATE POLICY "Users can delete their own documents"
    ON public.user_documents FOR DELETE
    USING (auth.uid() = user_id);


-- ====================================================================
-- 7. USER SCHEME RESULTS TABLE (AI Research & Analysis)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_scheme_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id VARCHAR(100),
    scheme_id VARCHAR(100) REFERENCES public.schemes(id) ON DELETE CASCADE,
    eligibility_status VARCHAR(50) NOT NULL, -- 'eligible' | 'potentially_eligible' | 'not_eligible'
    analysis_result JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_scheme_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own scheme results" ON public.user_scheme_results;
CREATE POLICY "Users can view their own scheme results"
    ON public.user_scheme_results FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scheme results" ON public.user_scheme_results;
CREATE POLICY "Users can insert their own scheme results"
    ON public.user_scheme_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scheme results" ON public.user_scheme_results;
CREATE POLICY "Users can delete their own scheme results"
    ON public.user_scheme_results FOR DELETE
    USING (auth.uid() = user_id);


-- ====================================================================
-- 8. CONVERSATIONS & MESSAGES TABLES (Permanent AI Chat History)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'नया संवाद',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure title column exists if table was created previously
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'नया संवाद';

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
CREATE POLICY "Users can insert their own conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
CREATE POLICY "Users can delete their own conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON public.conversations (user_id, updated_at DESC);


CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;
CREATE POLICY "Users can view their own messages"
    ON public.messages FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON public.messages;
CREATE POLICY "Users can insert their own messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages"
    ON public.messages FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages (conversation_id, created_at ASC);


-- ====================================================================
-- 8B. USER SAVED SCHEMES TABLE (User-Specific Bookmarked Schemes)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_saved_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_id VARCHAR(100) NOT NULL REFERENCES public.schemes(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_saved_scheme UNIQUE (user_id, scheme_id)
);

ALTER TABLE public.user_saved_schemes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved schemes" ON public.user_saved_schemes;
CREATE POLICY "Users can view their own saved schemes"
    ON public.user_saved_schemes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved schemes" ON public.user_saved_schemes;
CREATE POLICY "Users can insert their own saved schemes"
    ON public.user_saved_schemes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved schemes" ON public.user_saved_schemes;
CREATE POLICY "Users can delete their own saved schemes"
    ON public.user_saved_schemes FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_schemes_user ON public.user_saved_schemes (user_id, saved_at DESC);


-- ====================================================================
-- 9. APPLICATIONS TABLE (User Scheme Applications Tracker)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_id VARCHAR(100) REFERENCES public.schemes(id) ON DELETE CASCADE,
    application_status VARCHAR(50) DEFAULT 'draft', -- 'draft' | 'submitted_at_csc' | 'in_review' | 'approved'
    application_details JSONB NOT NULL DEFAULT '{}'::JSONB,
    application_reference VARCHAR(100),
    applied_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
CREATE POLICY "Users can view their own applications"
    ON public.applications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own applications" ON public.applications;
CREATE POLICY "Users can insert their own applications"
    ON public.applications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
CREATE POLICY "Users can update their own applications"
    ON public.applications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own applications" ON public.applications;
CREATE POLICY "Users can delete their own applications"
    ON public.applications FOR DELETE
    USING (auth.uid() = user_id);


-- ====================================================================
-- 10. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH.USERS INSERT
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone_number,
        avatar_url,
        preferred_language,
        theme_preference,
        is_onboarded
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        'hi',
        'light',
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ====================================================================
-- 11. SUPABASE STORAGE BUCKET & POLICIES (DOCUMENTS)
-- ====================================================================
-- Insert documents bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Users can only upload, read, update, delete files in their own folder (auth.uid())
DROP POLICY IF EXISTS "Users can read own documents" ON storage.objects;
CREATE POLICY "Users can read own documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ====================================================================
-- 12. PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_family_profiles_user ON public.family_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_user ON public.family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_user ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scheme_results_user ON public.user_scheme_results(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_schemes_active ON public.schemes(is_active);
