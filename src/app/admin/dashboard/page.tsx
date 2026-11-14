"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  PlusCircle,
  Edit2,
  Trash2,
  Award,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { CertificateRecord } from "@/types/certificate";

export default function AdminDashboardPage() {
  const [certificates, setCertificates] = useState<CertificateRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<CertificateRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/certificates");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCertificates(json.data);
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const targetId = deleteTarget.id || deleteTarget.student_id;
      const res = await fetch(`/api/certificates/${targetId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCertificates((prev) =>
          prev.filter(
            (c) =>
              c.id !== deleteTarget.id && c.student_id !== deleteTarget.student_id
          )
        );
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error("Failed to delete certificate:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter certificates
  const filteredCertificates = certificates.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.student_name.toLowerCase().includes(q) ||
      c.student_id.toLowerCase().includes(q) ||
      (c.registration_number && c.registration_number.toLowerCase().includes(q)) ||
      (c.major_subject && c.major_subject.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Student Certificates & Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search, add, edit, and manage all verified student degree records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/certificates/new"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#12284c] hover:bg-[#0d1d38] text-white text-xs sm:text-sm font-bold shadow-md transition"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            Add New Certificate
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-[#12284c] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#cca23b]" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Certificates
            </span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900">
              {certificates.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Registry Status
            </span>
            <span className="text-lg sm:text-2xl font-bold text-emerald-600">Active</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Programs
            </span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900">
              {new Set(certificates.map((c) => c.major_subject).filter(Boolean)).size || 1}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Year
            </span>
            <span className="text-lg sm:text-2xl font-bold text-slate-900">2026</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Search & Actions Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or ID..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#12284c] bg-white transition"
            />
          </div>
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing {filteredCertificates.length} of {certificates.length} records
          </span>
        </div>

        {/* Content View */}
        {isLoading ? (
          <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#12284c]" />
            <span className="text-xs sm:text-sm font-medium">Loading certificates...</span>
          </div>
        ) : filteredCertificates.length === 0 ? (
          <div className="py-14 sm:py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800">No records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No student matching "${searchQuery}" was found.`
                : "No certificates added yet. Click Add New Certificate to create one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-700 min-w-[640px]">
              <thead className="bg-slate-50 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 sm:px-4">Student</th>
                  <th className="py-3 px-3 sm:px-4">Student ID</th>
                  <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Reg No</th>
                  <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Major / Degree</th>
                  <th className="py-3 px-3 sm:px-4">CGPA</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Issue Date</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCertificates.map((cert) => {
                  const targetId = cert.id || cert.student_id;
                  return (
                    <tr
                      key={cert.student_id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Photo & Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-9 h-11 sm:w-10 sm:h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cert.student_photo_url || "/sample/tania_akter_photo.svg"}
                              alt={cert.student_name}
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight text-xs sm:text-sm">
                              {cert.student_name}
                            </span>
                            {cert.date_of_birth && (
                              <span className="text-[10px] sm:text-[11px] text-slate-400">
                                DOB: {cert.date_of_birth}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1 font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-1 rounded w-fit">
                          <span>{cert.student_id}</span>
                          <button
                            onClick={() => copyToClipboard(cert.student_id)}
                            className="text-slate-400 hover:text-slate-700"
                            title="Copy ID"
                          >
                            {copiedId === cert.student_id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Reg No */}
                      <td className="py-3 px-3 sm:px-4 hidden md:table-cell text-xs font-medium text-slate-600">
                        {cert.registration_number || "—"}
                      </td>

                      {/* Major / Degree */}
                      <td className="py-3 px-3 sm:px-4 hidden lg:table-cell text-xs font-medium text-slate-700 max-w-xs truncate">
                        {cert.major_subject || "—"}
                      </td>

                      {/* CGPA */}
                      <td className="py-3 px-3 sm:px-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                          {cert.cgpa || "—"}
                        </span>
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-xs text-slate-500">
                        {cert.issue_date || "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Live preview */}
                          <Link
                            href={`/?id=${cert.student_id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#12284c] hover:bg-slate-100 transition"
                            title="View Public Verification"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          {/* Edit */}
                          <Link
                            href={`/admin/certificates/${targetId}/edit`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                            title="Edit Certificate"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(cert)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Certificate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3 sm:mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Delete Certificate Record</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Are you sure you want to delete the record for{" "}
              <strong className="text-slate-900">{deleteTarget.student_name}</strong> (ID:{" "}
              <span className="font-mono">{deleteTarget.student_id}</span>)? This will immediately
              remove the verification from both Supabase and the verification portal.
            </p>

            <div className="mt-5 sm:mt-6 flex items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 sm:px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-3.5 sm:px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow transition flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
