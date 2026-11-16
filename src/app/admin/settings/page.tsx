"use client";

import React, { useState } from "react";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Server,
  HardDrive,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [copiedSql, setCopiedSql] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    tableFound: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qxyanvmriugmmbjygcmr.supabase.co";

  const sqlSchema = `-- ==============================================================================
-- University of Development Alternative (UODA) - Certificate Verification Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qxyanvmriugmmbjygcmr/sql
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

-- 4. Database Policies for public.certificates Table
DROP POLICY IF EXISTS "Public can view certificates by student_id" ON public.certificates;
CREATE POLICY "Public can view certificates by student_id"
    ON public.certificates
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow management on certificates" ON public.certificates;
DROP POLICY IF EXISTS "Allow anon full access for admin management" ON public.certificates;
CREATE POLICY "Allow management on certificates"
    ON public.certificates
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 5. Storage Buckets Setup (certificates & photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. Storage Policies for storage.objects
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
    USING (bucket_id = 'photos');`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const testSupabaseConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await fetch("/api/admin/test-supabase");
      const json = await res.json();
      setConnectionStatus({
        tested: true,
        connected: json.connected,
        tableFound: json.tableFound,
        message: json.message,
        details: json.details,
      });
    } catch {
      setConnectionStatus({
        tested: true,
        connected: false,
        tableFound: false,
        message: "Failed to connect to backend test service.",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSeedResult(json.message || "Sample records successfully seeded!");
      } else {
        setSeedResult(json.error || "Seeding failed.");
      }
    } catch {
      setSeedResult("Network error during seed.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Supabase Database & Integration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your Supabase Postgres connection, run migrations, and manage seed data.
        </p>
      </div>

      {/* Connection Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Supabase Project Configuration
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {supabaseUrl}
              </span>
            </div>
          </div>

          <button
            onClick={testSupabaseConnection}
            disabled={testingConnection}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12284c] text-white text-xs font-bold shadow hover:bg-[#0e1d35] transition disabled:opacity-75 cursor-pointer"
          >
            {testingConnection ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                Test Supabase Connection
              </>
            )}
          </button>
        </div>

        {/* Live Test Results Alert */}
        {connectionStatus && (
          <div
            className={`p-4 rounded-xl border text-xs sm:text-sm font-medium ${
              connectionStatus.tableFound
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : connectionStatus.connected
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {connectionStatus.tableFound ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              {connectionStatus.message}
            </div>
            {connectionStatus.details && (
              <p className="text-xs opacity-90 font-mono mt-1">
                {connectionStatus.details}
              </p>
            )}
            {!connectionStatus.tableFound && (
              <p className="text-xs mt-2">
                👉 <strong>Action Required:</strong> Copy the SQL schema below and run it in your{" "}
                <a
                  href="https://supabase.com/dashboard/project/qxyanvmriugmmbjygcmr/sql"
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-bold"
                >
                  Supabase SQL Editor
                </a>
                .
              </p>
            )}
          </div>
        )}

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Supabase Project
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              qxyanvmriugmmbjygcmr
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Publishable Key
            </span>
            <span className="text-sm font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Configured
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Dual-Layer Storage
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-500" />
              Supabase + Fallback
            </span>
          </div>
        </div>
      </div>

      {/* SQL Migration Script Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Supabase SQL Schema & Setup
            </h2>
            <p className="text-xs text-slate-500">
              Run this script once in your Supabase SQL Editor to create the table, indexes, and RLS policies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://supabase.com/dashboard/project/qxyanvmriugmmbjygcmr/sql"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <span>Open Supabase SQL</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <button
              onClick={copySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#cca23b] text-[#12284c] text-xs font-bold hover:bg-amber-400 transition cursor-pointer shadow-xs"
            >
              {copiedSql ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy SQL Script
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed">
            {sqlSchema}
          </pre>
        </div>
      </div>

      {/* Quick Seeder & Sample Data */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Seed Demo Student Record
            </h2>
            <p className="text-xs text-slate-500">
              Instantly re-seed student Tania Akter (ID: <span className="font-mono font-bold">789107238548</span>) and sample documents into the system.
            </p>
          </div>
        </div>

        {seedResult && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
            {seedResult}
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={handleSeedData}
            disabled={seeding}
            className="px-5 py-2.5 rounded-xl bg-[#12284c] hover:bg-[#0e1d35] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                Seed Sample Student (Tania Akter)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
