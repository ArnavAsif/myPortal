-- ==============================================================================
-- University of Development Alternative (UODA) - Complete Database & Storage Setup
-- Copy this ENTIRE script and run it in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qxyanvmriugmmbjygcmr/sql
-- ==============================================================================

-- 1. Create Certificates Table (Preserves all existing student records)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT NOT NULL UNIQUE,
    student_name TEXT NOT NULL,
    date_of_birth TEXT,
    registration_number TEXT,
    father_name TEXT,
    mother_name TEXT,
    major_subject TEXT,
    cgpa TEXT,
    issue_date TEXT,
    student_photo_url TEXT,
    certificate_image_url TEXT,
    certificate_pdf_url TEXT,
    degree_title TEXT DEFAULT 'Bachelor of Business Administration',
    institution_name TEXT DEFAULT 'University of Development Alternative',
    status TEXT DEFAULT 'verified',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for Fast Lookup by Student ID and Registration Number
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates (student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_reg_num ON public.certificates (registration_number);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 4. Database Policies for public.certificates Table
-- A. Public Verification (SELECT)
DROP POLICY IF EXISTS "Public can view certificates by student_id" ON public.certificates;
CREATE POLICY "Public can view certificates by student_id"
    ON public.certificates
    FOR SELECT
    TO public
    USING (true);

-- B. Full Management Access (INSERT, UPDATE, DELETE)
-- Fixes: "new row violates row-level security policy for table certificates"
DROP POLICY IF EXISTS "Allow management on certificates" ON public.certificates;
DROP POLICY IF EXISTS "Allow anon full access for admin management" ON public.certificates;
CREATE POLICY "Allow management on certificates"
    ON public.certificates
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- ==============================================================================
-- 5. Storage Buckets Setup (certificates & photos)
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ==============================================================================
-- 6. Storage Policies for storage.objects (Fixes all upload & download errors)
-- ==============================================================================

-- 'certificates' bucket policies
DROP POLICY IF EXISTS "Allow upload to certificates bucket" ON storage.objects;
CREATE POLICY "Allow upload to certificates bucket"
    ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Public can view certificate files" ON storage.objects;
CREATE POLICY "Public can view certificate files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Allow update certificates bucket" ON storage.objects;
CREATE POLICY "Allow update certificates bucket"
    ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'certificates')
    WITH CHECK (bucket_id = 'certificates');

DROP POLICY IF EXISTS "Allow delete certificates bucket" ON storage.objects;
CREATE POLICY "Allow delete certificates bucket"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'certificates');

-- 'photos' bucket policies
DROP POLICY IF EXISTS "Allow upload to photos bucket" ON storage.objects;
CREATE POLICY "Allow upload to photos bucket"
    ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Public can view photo files" ON storage.objects;
CREATE POLICY "Public can view photo files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "Allow update photos bucket" ON storage.objects;
CREATE POLICY "Allow update photos bucket"
    ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'photos')
    WITH CHECK (bucket_id = 'photos');

DROP POLICY IF EXISTS "Allow delete photos bucket" ON storage.objects;
CREATE POLICY "Allow delete photos bucket"
    ON storage.objects
    FOR DELETE
    TO public
    USING (bucket_id = 'photos');
