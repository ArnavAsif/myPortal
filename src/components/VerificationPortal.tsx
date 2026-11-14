"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Award,
  CheckCircle2,
  Download,
  AlertCircle,
  X,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ZoomIn,
  Loader2,
} from "lucide-react";
import { CertificateRecord, DISPLAY_FIELDS } from "@/types/certificate";
import { jsPDF } from "jspdf";

export default function VerificationPortal() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [studentIdInput, setStudentIdInput] = useState(initialId);
  const [isChecking, setIsChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const resultRef = useRef<HTMLDivElement>(null);

  // If initial ID passed in URL, verify automatically
  useEffect(() => {
    if (initialId) {
      handleVerify(initialId);
    }
  }, [initialId]);

  const handleVerify = async (idToSearch?: string) => {
    const targetId = (idToSearch !== undefined ? idToSearch : studentIdInput).trim();
    if (!targetId) {
      setErrorMessage("Please enter a valid Student ID number.");
      setCertificate(null);
      return;
    }

    setIsChecking(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/verify?id=${encodeURIComponent(targetId)}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(
          result.error || "No certificate found for that number. Please check it and try again."
        );
        setCertificate(null);
      } else {
        setCertificate(result.data);
        setErrorMessage(null);
        // Smooth scroll to result
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } catch {
      setErrorMessage("Unable to verify at this time. Please check your connection and try again.");
      setCertificate(null);
    } finally {
      setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  const handleDownloadPdf = async () => {
    if (!certificate) return;

    setIsDownloadingPdf(true);
    try {
      // If a dedicated PDF url is provided and valid, download it directly
      if (certificate.certificate_pdf_url && certificate.certificate_pdf_url.endsWith(".pdf")) {
        const link = document.createElement("a");
        link.href = certificate.certificate_pdf_url;
        link.download = `${certificate.major_subject ? certificate.major_subject.split(" ")[0] : "Certificate"}-${certificate.student_name.replace(/\s+/g, "_")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloadingPdf(false);
        return;
      }

      // Otherwise dynamically generate high-res PDF with jsPDF
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Borders
      doc.setDrawColor(22, 46, 88);
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 281, 194);

      doc.setDrawColor(204, 162, 59);
      doc.setLineWidth(0.8);
      doc.rect(12, 12, 273, 186);

      // Top info
      doc.setFont("courier", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Graduation ID: ${certificate.student_id}`, 20, 22);
      if (certificate.registration_number) {
        doc.text(`Reg No: ${certificate.registration_number}`, 240, 22);
      }

      // University Name
      doc.setFont("times", "bold");
      doc.setFontSize(26);
      doc.setTextColor(22, 46, 88);
      doc.text(certificate.institution_name || "University of Development Alternative", 148.5, 42, {
        align: "center",
      });

      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text("DHAKA, BANGLADESH", 148.5, 49, { align: "center" });

      // Degree Title
      doc.setFont("times", "bold");
      doc.setFontSize(22);
      doc.setTextColor(22, 46, 88);
      doc.text(certificate.degree_title || certificate.major_subject || "Bachelor Degree", 148.5, 68, {
        align: "center",
      });

      // Preamble
      doc.setFont("times", "italic");
      doc.setFontSize(13);
      doc.setTextColor(70, 70, 70);
      doc.text("This is to certify that", 148.5, 80, { align: "center" });

      // Student Name
      doc.setFont("times", "bolditalic");
      doc.setFontSize(24);
      doc.setTextColor(15, 23, 42);
      doc.text(certificate.student_name, 148.5, 95, { align: "center" });

      // Details
      doc.setFont("times", "normal");
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 40);
      if (certificate.major_subject) {
        doc.text(`obtained the Degree of ${certificate.major_subject}`, 148.5, 110, {
          align: "center",
        });
      }
      if (certificate.cgpa) {
        doc.text(
          `He/She secured Cumulative Grade Point Average (CGPA) ${certificate.cgpa} on a scale of 4.00.`,
          148.5,
          120,
          { align: "center" }
        );
      }

      // Bottom info
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      if (certificate.issue_date) {
        doc.text(`Date of Issue: ${certificate.issue_date}`, 25, 175);
      }

      doc.setFont("times", "bold");
      doc.text("Controller of Examinations", 220, 175);
      doc.text("Vice-Chancellor", 148.5, 180, { align: "center" });

      doc.save(
        `Certificate_${certificate.student_name.replace(/\s+/g, "_")}_${certificate.student_id}.pdf`
      );
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Filter display fields to ONLY show if data exists!
  const visibleFields = certificate
    ? DISPLAY_FIELDS.filter((f) => {
        const val = certificate[f.key];
        return val !== null && val !== undefined && String(val).trim() !== "";
      })
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb] text-slate-800 antialiased selection:bg-[#d4a037] selection:text-white">
      {/* 1. Header Bar */}
      <header className="bg-[#12284c] text-white shadow-md sticky top-0 z-40 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & University Name */}
          <Link href="/uoda" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-full bg-white p-1 shadow-sm flex items-center justify-center shrink-0 border border-amber-400/40 transition group-hover:scale-105">
              <Image
                src="/images/uoda-logo.svg"
                alt="University of Development Alternative Logo"
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
                priority
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs sm:text-sm font-medium tracking-wide text-slate-200">
                University of
              </span>
              <span className="text-sm sm:text-lg font-bold tracking-tight text-white group-hover:text-amber-300 transition-colors">
                Development Alternative
              </span>
            </div>
          </Link>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsContactOpen(true)}
              className="text-xs sm:text-sm font-medium text-slate-100 hover:text-white hover:underline transition-colors px-2 py-1"
            >
              Contact Us
            </button>
            <Link
              href="/admin/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition"
              title="Admin Panel"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Scrolling Ticker Announcement Bar */}
      <div className="bg-[#e9edf4] border-b border-slate-200/80 py-2.5 overflow-hidden text-xs sm:text-sm text-slate-700 select-none">
        <div className="animate-ticker font-medium tracking-wide flex items-center gap-12">
          <span>
            This is Only Official Website authorized by Uoda for Online Certificate Verification.
          </span>
          <span className="text-amber-600 font-bold">•</span>
          <span>
            authorized by Uoda for Online Certificate Verification.
          </span>
          <span className="text-amber-600 font-bold">•</span>
          <span>
            This is Only Official Website authorized by Uoda for Online Certificate Verification.
          </span>
          <span className="text-amber-600 font-bold">•</span>
          <span>
            authorized by Uoda for Online Certificate Verification.
          </span>
          <span className="text-amber-600 font-bold">•</span>
          <span>
            This is Only Official Website authorized by Uoda for Online Certificate Verification.
          </span>
        </div>
      </div>

      {/* 3. Main Verification Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Verification Card */}
        <div className="w-full max-w-xl rounded-2xl bg-gradient-to-br from-[#192f50] via-[#142844] to-[#0d1d33] p-6 sm:p-9 text-white shadow-2xl border border-[#2b4b75]/60 transition-all">
          <div className="flex flex-col items-center text-center">
            {/* Golden Medallion Badge */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-b from-[#223d63] to-[#162740] border-2 border-[#cca23b] flex items-center justify-center shadow-md mb-4">
              <Award className="w-7 h-7 text-[#cca23b]" />
            </div>

            {/* Main Prompt */}
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide max-w-md leading-snug">
              Enter Your Student ID Below to Verify its Authenticity
            </h1>

            {/* Subtitle */}
            <p className="text-[11px] sm:text-xs font-semibold tracking-widest text-[#8ba2c4] mt-1.5 uppercase">
              CERTIFICATE VERIFICATION
            </p>

            {/* Search Input & Button Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify();
              }}
              className="w-full mt-6 flex flex-col sm:flex-row items-stretch gap-2.5 sm:gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter Student ID (e.g. 789107238548)"
                  className="w-full h-12 px-4 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 font-medium text-sm sm:text-base outline-none focus:ring-2 focus:ring-[#cca23b] shadow-inner transition"
                  disabled={isChecking}
                />
              </div>

              <button
                type="submit"
                disabled={isChecking}
                className="h-12 px-7 rounded-lg bg-[#cca23b] hover:bg-[#d8ad42] active:bg-[#b89130] text-[#142844] font-bold text-sm sm:text-base transition duration-150 flex items-center justify-center shrink-0 shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isChecking ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#142844]" />
                    Checking...
                  </span>
                ) : (
                  "Verify"
                )}
              </button>
            </form>

            {/* Error Notification Banner (as seen in video & screenshot) */}
            {errorMessage && (
              <div className="w-full mt-4 py-2.5 px-4 rounded-lg bg-[#3a202d]/95 border border-[#6b2e45] text-rose-100 text-xs sm:text-sm font-medium flex items-center justify-center text-center animate-in fade-in duration-200">
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* 4. Verified Certificate Content (Only renders if data found) */}
        {certificate && (
          <div ref={resultRef} className="w-full max-w-3xl mt-8 space-y-6 animate-in fade-in duration-300">
            {/* Card 1: Official Student Record */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
              {/* Top Verified Header + Student Photo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight">
                      Certificate verified
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                      This record was found in our official register.
                    </p>
                  </div>
                </div>

                {/* Student Photo (Only shown if photo is available) */}
                {certificate.student_photo_url && (
                  <div className="self-end sm:self-auto shrink-0">
                    <div className="relative w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={certificate.student_photo_url}
                        alt={`Photo of ${certificate.student_name}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Grid of Verified Details */}
              {/* NOTE: Strictly only shows fields that have non-empty data! */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-6">
                {visibleFields.map((field) => {
                  const val = certificate[field.key];
                  return (
                    <div
                      key={field.key}
                      className="bg-[#f8fafc] border border-slate-200/70 rounded-xl p-3.5 sm:p-4 transition hover:bg-slate-50"
                    >
                      <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                        {field.label}
                      </span>
                      <span className="block text-sm sm:text-base font-semibold text-slate-800 mt-1 break-words">
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Certificate Document & PDF Download */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 flex flex-col items-center">
              <h3 className="text-base sm:text-lg font-serif font-medium text-slate-700 text-center mb-5">
                Your certificate
              </h3>

              {/* Certificate Image Frame */}
              <div className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={certificate.certificate_image_url || "/sample/tania_akter_certificate.svg"}
                  alt="Official Degree Certificate"
                  className="w-full h-auto object-contain cursor-pointer transition group-hover:opacity-95"
                  onClick={() => setIsZoomOpen(true)}
                />
                <button
                  type="button"
                  onClick={() => setIsZoomOpen(true)}
                  className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-lg backdrop-blur-sm shadow-md transition opacity-80 group-hover:opacity-100 flex items-center gap-1.5 text-xs font-medium"
                >
                  <ZoomIn className="w-4 h-4" />
                  <span className="hidden sm:inline">View Large</span>
                </button>
              </div>

              {/* Download Button */}
              <div className="mt-7 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-8 py-3 rounded-lg bg-[#14294b] hover:bg-[#0e1d35] active:bg-[#0a1527] text-white font-bold text-sm sm:text-base shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </>
                  )}
                </button>
                <span className="text-[11px] text-slate-400">
                  Official digitally verified copy in standard format
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 5. Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026{" "}
            <span className="font-semibold text-slate-700">
              University of Development Alternative
            </span>{" "}
            All Rights Reserved.
          </p>
          <div className="flex items-center gap-4 text-slate-400 text-xs">
            <button
              onClick={() => setIsContactOpen(true)}
              className="hover:text-slate-600 transition"
            >
              Contact Support
            </button>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-slate-600 transition">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>

      {/* Contact Us Modal */}
      {isContactOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#12284c] flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Contact Verification Office</h3>
                <p className="text-xs text-slate-500">University of Development Alternative</p>
              </div>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600 mt-5">
              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wide">
                    Campus Address
                  </span>
                  <span>80, Satmasjid Road, Dhanmondi, Dhaka-1209, Bangladesh</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wide">
                    Phone Numbers
                  </span>
                  <span>+880-2-9145741, +880-2-9134695</span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block text-xs uppercase tracking-wide">
                    Official Email
                  </span>
                  <span>verification@uoda.edu.bd / info@uoda.edu.bd</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsContactOpen(false)}
                className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Fullscreen Zoom Modal */}
      {isZoomOpen && certificate && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3">
            <span className="text-sm font-semibold">
              Official Certificate Preview — {certificate.student_name} ({certificate.student_id})
            </span>
            <button
              onClick={() => setIsZoomOpen(false)}
              className="text-white hover:text-amber-300 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative max-h-[85vh] max-w-5xl overflow-auto rounded-xl bg-white p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={certificate.certificate_image_url || "/sample/tania_akter_certificate.svg"}
              alt="Full Resolution Certificate"
              className="w-full h-auto object-contain max-h-[80vh]"
            />
          </div>
          <div className="mt-4 flex gap-4">
            <button
              onClick={handleDownloadPdf}
              className="px-6 py-2 rounded-lg bg-[#cca23b] text-[#142844] font-bold text-sm shadow hover:bg-amber-400 transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={() => setIsZoomOpen(false)}
              className="px-5 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-medium text-sm transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
