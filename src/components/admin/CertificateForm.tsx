"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  User,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { CertificateRecord, DISPLAY_FIELDS } from "@/types/certificate";
import { hasUploadedCertificateDocument, isPdfDocument } from "@/lib/storage";

interface CertificateFormProps {
  initialData?: CertificateRecord;
  isEdit?: boolean;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export default function CertificateForm({
  initialData,
  isEdit = false,
}: CertificateFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<CertificateRecord>({
    student_id: initialData?.student_id || "",
    student_name: initialData?.student_name || "",
    date_of_birth: initialData?.date_of_birth || "",
    registration_number: initialData?.registration_number || "",
    father_name: initialData?.father_name || "",
    mother_name: initialData?.mother_name || "",
    major_subject:
      initialData?.major_subject || "Bachelor of Business Administration (BBA)",
    cgpa: initialData?.cgpa || "",
    issue_date: initialData?.issue_date || "",
    student_photo_url: initialData?.student_photo_url || "",
    certificate_image_url: initialData?.certificate_image_url || "",
    certificate_pdf_url: initialData?.certificate_pdf_url || "",
    degree_title:
      initialData?.degree_title || "Bachelor of Business Administration",
    institution_name:
      initialData?.institution_name ||
      "University of Development Alternative",
    status: initialData?.status || "verified",
  });

  // Ephemeral preview URLs for immediate UI feedback
  const [certPreviewUrl, setCertPreviewUrl] = useState<string>(
    initialData?.certificate_pdf_url || initialData?.certificate_image_url || ""
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string>(
    initialData?.student_photo_url || ""
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Upload handler for photos & certificates to Supabase Storage
  const handleFileUpload = async (
    file: File,
    type: "photo" | "certificate"
  ) => {
    setErrorMessage(null);

    // 1. Client-Side Size Validation (Max 10MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setErrorMessage(
        `Selected file is ${sizeMb} MB. Please upload a file smaller than 10 MB.`
      );
      return;
    }

    // 2. Client-Side Type Validation
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (type === "photo") {
      const photoExts = [".jpg", ".jpeg", ".png", ".webp"];
      if (!photoExts.includes(ext)) {
        setErrorMessage(
          `Invalid photo format '${ext}'. Please select a JPG, PNG, or WebP image.`
        );
        return;
      }
    } else {
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMessage(
          `Invalid certificate format '${ext}'. Only JPG, PNG, WebP, and PDF documents are supported.`
        );
        return;
      }
    }

    if (type === "photo") setUploadingPhoto(true);
    else setUploadingCert(true);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("studentId", formData.student_id.trim() || "general");
      data.append("bucket", type === "photo" ? "photos" : "certificates");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "File upload failed. Please try again.");
        return;
      }

      if (type === "photo") {
        setPhotoPreviewUrl(json.url);
        setFormData((prev) => ({
          ...prev,
          student_photo_url: json.path || json.url,
        }));
      } else {
        const isPdf = json.isPdf || ext === ".pdf";
        setCertPreviewUrl(json.url);

        setFormData((prev) => ({
          ...prev,
          certificate_image_url: isPdf ? "" : json.path || json.url,
          certificate_pdf_url: isPdf ? json.path || json.url : "",
        }));
      }

      setSuccessMessage(
        `${type === "photo" ? "Passport photo" : "Certificate document"} uploaded to Supabase Storage!`
      );
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      console.error("[Upload Exception]:", err);
      setErrorMessage("Network error during file upload. Please verify your connection.");
    } finally {
      if (type === "photo") setUploadingPhoto(false);
      else setUploadingCert(false);
    }
  };

  const handleClearCertificate = () => {
    setCertPreviewUrl("");
    setFormData((prev) => ({
      ...prev,
      certificate_image_url: "",
      certificate_pdf_url: "",
    }));
    if (certInputRef.current) certInputRef.current.value = "";
  };

  const handleClearPhoto = () => {
    setPhotoPreviewUrl("");
    setFormData((prev) => ({
      ...prev,
      student_photo_url: "",
    }));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadingCert || uploadingPhoto) {
      setErrorMessage("Please wait until the file upload completes before saving.");
      return;
    }

    if (!formData.student_id.trim() || !formData.student_name.trim()) {
      setErrorMessage("Student ID and Student Name are required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const url = isEdit
        ? `/api/certificates/${initialData?.id || initialData?.student_id}`
        : "/api/certificates";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Failed to save certificate record.");
      } else {
        setSuccessMessage(
          isEdit
            ? "Certificate updated successfully!"
            : "Certificate registered successfully!"
        );
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 800);
      }
    } catch {
      setErrorMessage("An error occurred while saving. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview fields that have values
  const previewFields = DISPLAY_FIELDS.filter((f) => {
    const val = formData[f.key];
    return val !== null && val !== undefined && String(val).trim() !== "";
  });

  const hasCertDocument = hasUploadedCertificateDocument(formData);
  const isCertPdf = isPdfDocument(formData.certificate_pdf_url || certPreviewUrl || formData.certificate_image_url);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? "Edit Student Certificate" : "Register New Certificate"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isEdit
                ? "Update student information, replace documents, or modify degree details"
                : "Fill out the student details and attach certificates to add to the registry"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <Eye className="w-4 h-4 text-amber-500" />
          <span>{showLivePreview ? "Hide Preview" : "Preview Portal Card"}</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Live Preview Mode (collapsible) */}
      {showLivePreview && (
        <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Live Portal Preview (Only filled fields & valid uploaded documents will be visible)
            </span>
            <button
              onClick={() => setShowLivePreview(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close Preview
            </button>
          </div>

          <div className="bg-white rounded-xl text-slate-800 p-5 shadow-inner space-y-4">
            {/* Card 1 Preview */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">Certificate verified</h4>
                    <p className="text-xs text-slate-500">Official UODA Register</p>
                  </div>
                </div>
                {photoPreviewUrl && (
                  <div className="w-16 h-20 rounded border border-slate-200 overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreviewUrl}
                      alt="Student Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                {previewFields.map((f) => (
                  <div key={f.key} className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">{f.label}</span>
                    <span className="block text-sm font-semibold text-slate-800">{formData[f.key]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2 Preview: ONLY shown if document uploaded! */}
            {hasCertDocument ? (
              <div className="border-t border-slate-100 pt-4 text-center">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide block mb-2">
                  Document Preview Section (Visible because document is uploaded)
                </span>
                {isCertPdf ? (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center gap-3 text-slate-700">
                    <FileText className="w-6 h-6 text-rose-600" />
                    <span className="text-sm font-semibold">PDF Certificate Ready for Download</span>
                  </div>
                ) : (
                  <div className="max-w-xs mx-auto border rounded-lg overflow-hidden bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={certPreviewUrl || formData.certificate_image_url || ""}
                      alt="Certificate Preview"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-400 italic">
                (No certificate document attached — Document section and Download button will be completely hidden on public portal)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Student Identification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-[#cca23b]" />
            <h2 className="text-base font-bold text-slate-900">
              Student Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Student Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="student_name"
                required
                value={formData.student_name}
                onChange={handleInputChange}
                placeholder="e.g. Tania Akter"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Student ID (Search Number) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="student_id"
                required
                value={formData.student_id}
                onChange={handleInputChange}
                placeholder="e.g. 789107238548"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                This exact number is what users type in the public search bar.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Registration Number
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number || ""}
                onChange={handleInputChange}
                placeholder="e.g. 358737"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Date of Birth
              </label>
              <input
                type="text"
                name="date_of_birth"
                value={formData.date_of_birth || ""}
                onChange={handleInputChange}
                placeholder="e.g. 09 Sep 1992"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Father&apos;s Name
              </label>
              <input
                type="text"
                name="father_name"
                value={formData.father_name || ""}
                onChange={handleInputChange}
                placeholder="e.g. Rafiqul Islam"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mother&apos;s Name
              </label>
              <input
                type="text"
                name="mother_name"
                value={formData.mother_name || ""}
                onChange={handleInputChange}
                placeholder="e.g. Nahar Begum"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Academic & Degree Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <GraduationCap className="w-5 h-5 text-[#cca23b]" />
            <h2 className="text-base font-bold text-slate-900">
              Academic & Degree Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Major Subject / Degree Program
              </label>
              <input
                type="text"
                name="major_subject"
                value={formData.major_subject || ""}
                onChange={handleInputChange}
                placeholder="e.g. Bachelor of Business Administration (BBA)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Cumulative GPA (CGPA)
              </label>
              <input
                type="text"
                name="cgpa"
                value={formData.cgpa || ""}
                onChange={handleInputChange}
                placeholder="e.g. 3.25"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Date
              </label>
              <input
                type="text"
                name="issue_date"
                value={formData.issue_date || ""}
                onChange={handleInputChange}
                placeholder="e.g. 2020-12-01 or 01-12-2020"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Institution Name
              </label>
              <input
                type="text"
                name="institution_name"
                value={formData.institution_name || ""}
                onChange={handleInputChange}
                placeholder="University of Development Alternative"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Verification Status
              </label>
              <select
                name="status"
                value={formData.status || "verified"}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#12284c] bg-white transition"
              >
                <option value="verified">Verified (Active on portal)</option>
                <option value="pending">Pending</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Student Photo & Certificate Files */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <ImageIcon className="w-5 h-5 text-[#cca23b]" />
            <h2 className="text-base font-bold text-slate-900">
              Photos & Certificate Documents
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Student Photo */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Student Passport Photo <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>

              {/* Photo Preview Card */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="w-20 h-24 rounded-lg border-2 border-slate-300 overflow-hidden bg-slate-200 shrink-0 relative flex items-center justify-center">
                  {photoPreviewUrl || formData.student_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoPreviewUrl || formData.student_photo_url || ""}
                      alt="Student"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], "photo");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto || isSubmitting}
                    className="w-full py-2 px-3 rounded-lg bg-[#12284c] text-white text-xs font-semibold hover:bg-[#0d1d38] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload Photo
                      </>
                    )}
                  </button>
                  {(photoPreviewUrl || formData.student_photo_url) && (
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      className="text-[11px] text-rose-600 hover:underline block text-center cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              {/* Or manual URL */}
              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">
                  Storage Path or External URL:
                </span>
                <input
                  type="text"
                  name="student_photo_url"
                  value={formData.student_photo_url || ""}
                  onChange={handleInputChange}
                  placeholder="e.g. 789107238548/photo.jpg or /sample/..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#12284c]"
                />
              </div>
            </div>

            {/* Certificate Document */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Certificate Image / Document
                </label>
                <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Optional
                </span>
              </div>

              {/* Certificate Preview Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="w-full min-h-[7rem] max-h-48 rounded-lg border border-slate-300 overflow-hidden bg-slate-200 relative flex items-center justify-center p-2">
                  {uploadingCert ? (
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <Loader2 className="w-6 h-6 animate-spin text-[#12284c]" />
                      <span className="text-xs font-medium">Uploading to Supabase Storage...</span>
                    </div>
                  ) : hasCertDocument ? (
                    isCertPdf ? (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <FileText className="w-10 h-10 text-rose-600 mb-1" />
                        <span className="text-xs font-bold text-slate-800">PDF Certificate Attached</span>
                        <span className="text-[11px] text-slate-500 font-mono truncate max-w-[240px]">
                          {formData.certificate_pdf_url || "document.pdf"}
                        </span>
                        {certPreviewUrl && (
                          <a
                            href={certPreviewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 text-[11px] text-blue-600 font-semibold inline-flex items-center gap-1 hover:underline"
                          >
                            <span>Open PDF</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={certPreviewUrl || formData.certificate_image_url || ""}
                        alt="Certificate Preview"
                        className="w-full h-auto max-h-40 object-contain"
                      />
                    )
                  ) : (
                    <div className="text-center p-2 text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-1 opacity-60" />
                      <span className="text-xs block font-medium">No document attached</span>
                      <span className="text-[10px] block opacity-80">(Optional — portal will hide certificate section)</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={certInputRef}
                    accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], "certificate");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => certInputRef.current?.click()}
                    disabled={uploadingCert || isSubmitting}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#12284c] text-white text-xs font-semibold hover:bg-[#0d1d38] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {uploadingCert ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Uploading Document...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        {hasCertDocument ? "Replace Document" : "Upload Certificate"}
                      </>
                    )}
                  </button>
                  {hasCertDocument && (
                    <button
                      type="button"
                      onClick={handleClearCertificate}
                      className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                      title="Clear Certificate Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Or manual URL/path */}
              <div>
                <span className="text-[11px] text-slate-500 font-medium block mb-1">
                  Supabase Storage Path:
                </span>
                <input
                  type="text"
                  name="certificate_image_url"
                  value={
                    formData.certificate_pdf_url ||
                    formData.certificate_image_url ||
                    ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    const isPdf = isPdfDocument(val);
                    setFormData((p) => ({
                      ...p,
                      certificate_image_url: isPdf ? "" : val,
                      certificate_pdf_url: isPdf ? val : "",
                    }));
                  }}
                  placeholder="e.g. 789107238548/certificate.pdf (leave empty if none)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-[#12284c]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/dashboard"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || uploadingCert || uploadingPhoto}
            className="px-7 py-2.5 rounded-xl bg-[#12284c] hover:bg-[#0d1d38] text-white text-sm font-bold shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Record...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-400" />
                {isEdit ? "Update Certificate" : "Save and Register Certificate"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
