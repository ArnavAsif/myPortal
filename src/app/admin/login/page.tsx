"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff, Loader2, CheckSquare, Square } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("from") || "/admin/dashboard";

  // Clean empty inputs - no prefilled values or leaked credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, trustDevice }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Invalid login credentials.");
      } else {
        router.push(returnTo);
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-10">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-50 border-2 border-amber-400/50 p-1 flex items-center justify-center shadow-sm mb-3.5">
          <Image
            src="/images/uoda-logo.svg"
            alt="UODA Emblem"
            width={52}
            height={52}
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain"
            priority
          />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#12284c] border border-blue-100 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          Restricted Admin Area
        </span>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Admin Sign In</h1>
        <p className="text-xs text-slate-500 mt-1">
          Authorized administrative access only
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium animate-in fade-in duration-150">
          {errorMessage}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Trust This Device Option */}
        <div className="pt-1">
          <label
            onClick={() => setTrustDevice(!trustDevice)}
            className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 select-none hover:text-slate-900 transition"
          >
            <input
              type="checkbox"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.target.checked)}
              className="sr-only"
            />
            {trustDevice ? (
              <CheckSquare className="w-4 h-4 text-[#12284c] shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="font-medium">
              Trust this device <span className="text-slate-400 font-normal">(stay signed in)</span>
            </span>
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#12284c] hover:bg-[#0d1d38] active:bg-[#091427] text-white font-bold text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Sign In to Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Back to Portal Link */}
      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-[#12284c] font-medium transition inline-flex items-center gap-1.5"
        >
          ← Back to Public Verification Portal
        </Link>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#f4f7fb] px-4 py-8 sm:py-12 antialiased">
      <Suspense
        fallback={
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#12284c]" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
