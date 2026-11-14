-- ==============================================================================
-- University of Development Alternative (UODA) - Certificate Verification Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/qxyanvmriugmmbjygcmr/sql)
-- ==============================================================================

-- 1. Create Certificates Table
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

-- 2. Create Index on student_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates (student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_reg_num ON public.certificates (registration_number);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 4. Policies:
-- Allow anyone (public anon) to read certificates (needed for verification portal)
DROP POLICY IF EXISTS "Public can view certificates by student_id" ON public.certificates;
CREATE POLICY "Public can view certificates by student_id"
    ON public.certificates
    FOR SELECT
    TO public
    USING (true);

-- Allow full access to all operations for now (or authenticated users / anon for admin panel)
DROP POLICY IF EXISTS "Allow anon full access for admin management" ON public.certificates;
CREATE POLICY "Allow anon full access for admin management"
    ON public.certificates
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 5. Insert Sample Data for Tania Akter (from demo video)
INSERT INTO public.certificates (
    student_id,
    student_name,
    date_of_birth,
    registration_number,
    father_name,
    mother_name,
    major_subject,
    cgpa,
    issue_date,
    student_photo_url,
    certificate_image_url,
    certificate_pdf_url,
    degree_title
) VALUES (
    '789107238548',
    'Tania Akter',
    '09 Sep 1992',
    '358737',
    'Rafiqul Islam',
    'Nahar Begum',
    'Bachelor of Business Administration (BBA)',
    '3.25',
    '2020-12-01',
    '/sample/tania_akter_photo.jpg',
    '/sample/tania_akter_certificate.jpg',
    '/sample/tania_akter_certificate.pdf',
    'Bachelor of Business Administration'
) ON CONFLICT (student_id) DO UPDATE SET
    student_name = EXCLUDED.student_name,
    date_of_birth = EXCLUDED.date_of_birth,
    registration_number = EXCLUDED.registration_number,
    father_name = EXCLUDED.father_name,
    mother_name = EXCLUDED.mother_name,
    major_subject = EXCLUDED.major_subject,
    cgpa = EXCLUDED.cgpa,
    issue_date = EXCLUDED.issue_date,
    student_photo_url = EXCLUDED.student_photo_url,
    certificate_image_url = EXCLUDED.certificate_image_url,
    certificate_pdf_url = EXCLUDED.certificate_pdf_url,
    degree_title = EXCLUDED.degree_title;
