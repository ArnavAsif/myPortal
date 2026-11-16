import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  BUCKET_CERTIFICATES,
  ALL_ALLOWED_MIMES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  isPdfDocument,
} from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Admin Session Cookie
    const sessionCookie = request.cookies.get("uoda_admin_session");
    if (sessionCookie?.value !== "authenticated") {
      return NextResponse.json(
        { error: "Unauthorized. Please log in to the admin panel to upload documents." },
        { status: 401 }
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const studentIdRaw = (formData.get("studentId") as string) || "";
    const requestedBucket = (formData.get("bucket") as string) || BUCKET_CERTIFICATES;

    // Normalize bucket: only allow valid buckets (defaults to 'certificates')
    const bucket = requestedBucket.trim() === "photos" ? "photos" : BUCKET_CERTIFICATES;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided for upload." },
        { status: 400 }
      );
    }

    // 3. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File size (${sizeMb} MB) exceeds the maximum allowed limit of 10 MB. Please compress or choose a smaller file.`,
        },
        { status: 413 }
      );
    }

    // 4. Validate File Extension and MIME Type
    const ext = path.extname(file.name).toLowerCase();
    const mime = file.type.toLowerCase();

    const isExtAllowed = ALLOWED_EXTENSIONS.includes(ext);
    const isMimeAllowed =
      ALL_ALLOWED_MIMES.includes(mime) ||
      (mime === "application/octet-stream" && isExtAllowed);

    if (!isExtAllowed || !isMimeAllowed) {
      return NextResponse.json(
        {
          error: `Unsupported file format '${ext || "unknown"}'. Only JPG, JPEG, PNG, WebP images and PDF documents are allowed.`,
        },
        { status: 400 }
      );
    }

    // 5. Structure Sensible Object Path
    // e.g. "789107238548/1715000000_original_filename.jpg"
    const cleanStudentId = studentIdRaw.replace(/[^a-zA-Z0-9_-]/g, "").trim() || "general";
    const rawBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const uniqueFileName = `${Date.now()}_${rawBaseName || "document"}${ext}`;
    const storagePath = `${cleanStudentId}/${uniqueFileName}`;

    // 6. Read File Bytes
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 7. Initialize Privileged Supabase Admin Client
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Supabase client configuration is missing on the server. Please verify NEXT_PUBLIC_SUPABASE_URL and credentials in Vercel.",
        },
        { status: 500 }
      );
    }

    // 8. Upload to Supabase Storage Bucket
    let activeBucket = bucket;
    let { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(activeBucket)
      .upload(storagePath, buffer, {
        contentType: mime || (ext === ".pdf" ? "application/pdf" : "image/jpeg"),
        upsert: false, // Prevent accidental overwriting
      });

    // If 'photos' bucket upload failed (e.g. bucket does not exist or lacks policy),
    // automatically attempt storing in the primary 'certificates' bucket
    if (uploadError && activeBucket === "photos") {
      console.warn(
        `[Storage] Upload to 'photos' bucket failed (${uploadError.message}). Retrying in '${BUCKET_CERTIFICATES}' bucket...`
      );
      const retryResult = await supabaseAdmin.storage
        .from(BUCKET_CERTIFICATES)
        .upload(storagePath, buffer, {
          contentType: mime || (ext === ".pdf" ? "application/pdf" : "image/jpeg"),
          upsert: false,
        });

      if (!retryResult.error && retryResult.data) {
        uploadData = retryResult.data;
        uploadError = null;
        activeBucket = BUCKET_CERTIFICATES;
      }
    }

    if (uploadError || !uploadData) {
      console.error("[Supabase Storage Upload Error]:", {
        bucket: activeBucket,
        storagePath,
        error: uploadError?.message,
      });

      const isRlsError =
        uploadError?.message?.toLowerCase().includes("row-level security") ||
        uploadError?.message?.toLowerCase().includes("violates");

      const errorMessage = isRlsError
        ? `Supabase Storage upload blocked by Row-Level Security (RLS). Please run the Storage Policy SQL in your Supabase SQL Editor for bucket '${activeBucket}', or add SUPABASE_SERVICE_ROLE_KEY to Vercel/env.`
        : `Supabase Storage upload failed: ${
            uploadError?.message || "Storage service rejected the file"
          }. Please verify bucket '${activeBucket}' exists and permissions are configured.`;

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // 9. Generate Initial Access URL for Preview (Signed URL default 24 hours)
    let accessUrl = "";
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from(activeBucket)
      .createSignedUrl(storagePath, 86400); // 24 hours

    if (!signedError && signedData?.signedUrl) {
      accessUrl = signedData.signedUrl;
    } else {
      // Fallback to public URL if bucket is configured as public
      const { data: publicData } = supabaseAdmin.storage
        .from(activeBucket)
        .getPublicUrl(storagePath);
      accessUrl = publicData.publicUrl;
    }

    // 10. Return Structured Result
    return NextResponse.json({
      success: true,
      path: storagePath, // Canonical storage path to persist in database
      url: accessUrl, // Active preview URL for UI
      filename: file.name,
      isPdf: isPdfDocument(ext),
      bucket: activeBucket,
      storage: "supabase",
    });
  } catch (err: unknown) {
    console.error("[Upload Route Fatal Error]:", err);
    return NextResponse.json(
      {
        error: `Unexpected server error during file upload: ${
          err instanceof Error ? err.message : String(err)
        }`,
      },
      { status: 500 }
    );
  }
}
