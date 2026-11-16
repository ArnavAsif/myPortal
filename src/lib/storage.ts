import { getSupabaseAdminClient } from "./supabaseServer";

export const BUCKET_CERTIFICATES = "certificates";
export const BUCKET_PHOTOS = "photos";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const ALLOWED_DOC_MIMES = ["application/pdf"];

export const ALL_ALLOWED_MIMES = [
  ...ALLOWED_IMAGE_MIMES,
  ...ALLOWED_DOC_MIMES,
];

export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

// 10 Megabytes max limit
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Checks whether a given path or URL points to a PDF document.
 */
export function isPdfDocument(pathOrUrl: string | null | undefined): boolean {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return false;
  const clean = pathOrUrl.split("?")[0].toLowerCase();
  return clean.endsWith(".pdf");
}

/**
 * Validates whether a certificate record has an ACTUAL uploaded certificate document.
 * Excludes null, undefined, empty strings, and legacy sample / dummy SVG paths.
 */
export function hasUploadedCertificateDocument(cert: {
  certificate_image_url?: string | null;
  certificate_pdf_url?: string | null;
} | null | undefined): boolean {
  if (!cert) return false;

  const url = (cert.certificate_image_url || cert.certificate_pdf_url || "").trim();
  if (!url) return false;

  // Ignore dummy or sample paths from earlier demo data
  if (
    url.startsWith("/sample/") ||
    url.includes("sample_certificate") ||
    url.includes("tania_akter_certificate.svg")
  ) {
    return false;
  }

  return true;
}

/**
 * Extracts the storage object path if a full Supabase URL was passed in.
 * e.g. "https://xyz.supabase.co/storage/v1/object/public/certificates/789107238548/file.jpg" -> "789107238548/file.jpg"
 */
export function extractStoragePath(
  pathOrUrl: string,
  bucket: string = BUCKET_CERTIFICATES
): string {
  const clean = pathOrUrl.split("?")[0].trim();

  // If already relative / storage path
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    // If it starts with /certificates/, remove prefix
    if (clean.startsWith(`/${bucket}/`)) {
      return clean.replace(`/${bucket}/`, "");
    }
    if (clean.startsWith(`${bucket}/`)) {
      return clean.replace(`${bucket}/`, "");
    }
    return clean.replace(/^\/+/, "");
  }

  // Look for bucket in Supabase storage URL patterns
  const publicMarker = `/object/public/${bucket}/`;
  const signMarker = `/object/sign/${bucket}/`;
  const authMarker = `/object/authenticated/${bucket}/`;
  const plainMarker = `/object/${bucket}/`;

  for (const marker of [publicMarker, signMarker, authMarker, plainMarker]) {
    const idx = clean.indexOf(marker);
    if (idx !== -1) {
      return decodeURIComponent(clean.substring(idx + marker.length));
    }
  }

  return clean;
}

/**
 * Resolves a storage path or URL into an accessible URL for preview and download.
 * If the bucket is private, generates a temporary signed URL (default 24 hours).
 * If signed URL creation fails or if the URL is an external link, gracefully falls back.
 */
export async function resolveStorageUrl(
  pathOrUrl: string | null | undefined,
  bucket: string = BUCKET_CERTIFICATES,
  expiresInSeconds: number = 86400 // 24 hours
): Promise<string | null> {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return null;

  // Leave local paths (like /sample/ or /uploads/) intact if they don't involve Supabase Storage
  if (trimmed.startsWith("/sample/") || trimmed.startsWith("/uploads/")) {
    return trimmed;
  }

  const adminClient = getSupabaseAdminClient();
  if (!adminClient) {
    return trimmed;
  }

  const objectPath = extractStoragePath(trimmed, bucket);

  // If extractStoragePath returned an unrelated external URL (e.g. https://other-host.com), keep it
  if (objectPath.startsWith("http://") || objectPath.startsWith("https://")) {
    return objectPath;
  }

  try {
    // 1. Try to generate a signed URL (works for both private and public buckets with admin client)
    const { data: signedData, error: signedError } = await adminClient.storage
      .from(bucket)
      .createSignedUrl(objectPath, expiresInSeconds);

    if (!signedError && signedData?.signedUrl) {
      return signedData.signedUrl;
    }

    if (signedError) {
      // If photo was not found in 'photos' bucket, try 'certificates' bucket
      if (bucket === BUCKET_PHOTOS) {
        const { data: retryData, error: retryError } = await adminClient.storage
          .from(BUCKET_CERTIFICATES)
          .createSignedUrl(objectPath, expiresInSeconds);
        if (!retryError && retryData?.signedUrl) {
          return retryData.signedUrl;
        }
      }
      console.warn(
        `[Storage] createSignedUrl notice for ${bucket}/${objectPath}:`,
        signedError.message
      );
    }

    // 2. Fall back to public URL
    const { data: publicData } = adminClient.storage
      .from(bucket)
      .getPublicUrl(objectPath);

    return publicData?.publicUrl || trimmed;
  } catch (err) {
    console.error(`[Storage] Failed to resolve URL for ${bucket}/${objectPath}:`, err);
    return trimmed;
  }
}
