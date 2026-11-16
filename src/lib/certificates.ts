import fs from "fs";
import path from "path";
import { CertificateRecord } from "@/types/certificate";
import { getSupabaseAdminClient, getSupabaseClient } from "./supabaseServer";
import {
  resolveStorageUrl,
  BUCKET_CERTIFICATES,
  BUCKET_PHOTOS,
  isPdfDocument,
} from "./storage";

const JSON_FILE_PATH = path.join(process.cwd(), "data", "certificates.json");

/**
 * Checks whether a string is a standard RFC 4122 UUID.
 * Necessary because Postgres rejects invalid syntax if a non-UUID is passed to a UUID column.
 */
function isUUID(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim()
  );
}

// Read local JSON fallback
function readLocalJson(): CertificateRecord[] {
  try {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      return [];
    }
    const content = fs.readFileSync(JSON_FILE_PATH, "utf-8");
    return JSON.parse(content) as CertificateRecord[];
  } catch (err) {
    console.error("[Local JSON] Error reading local certificates backup:", err);
    return [];
  }
}

// Write local JSON fallback
function writeLocalJson(records: CertificateRecord[]) {
  try {
    const dir = path.dirname(JSON_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err) {
    console.error("[Local JSON] Error writing local certificates backup:", err);
  }
}

/**
 * Resolves storage paths into fresh, accessible signed/public URLs.
 * Leaves dummy sample SVGs out of real document URLs as required.
 */
async function enrichCertificateUrls(
  cert: CertificateRecord
): Promise<CertificateRecord> {
  const enriched = { ...cert };

  // 1. Certificate Document Image / PDF handling
  // If the record has dummy sample SVG, do not treat it as a real uploaded certificate document
  if (
    enriched.certificate_image_url &&
    (enriched.certificate_image_url.startsWith("/sample/") ||
      enriched.certificate_image_url.includes("sample_certificate"))
  ) {
    enriched.certificate_image_url = null;
  }

  if (
    enriched.certificate_pdf_url &&
    (enriched.certificate_pdf_url.startsWith("/sample/") ||
      enriched.certificate_pdf_url.includes("sample_certificate"))
  ) {
    enriched.certificate_pdf_url = null;
  }

  // Resolve certificate image URL if present
  if (enriched.certificate_image_url) {
    const resolved = await resolveStorageUrl(
      enriched.certificate_image_url,
      BUCKET_CERTIFICATES
    );
    enriched.certificate_image_url = resolved;
  }

  // Resolve certificate PDF URL if present
  if (enriched.certificate_pdf_url) {
    const resolved = await resolveStorageUrl(
      enriched.certificate_pdf_url,
      BUCKET_CERTIFICATES
    );
    enriched.certificate_pdf_url = resolved;
  }

  // Resolve student passport photo URL if present
  if (enriched.student_photo_url) {
    // Only resolve through Supabase if it's not a local sample asset
    if (!enriched.student_photo_url.startsWith("/sample/")) {
      const resolved = await resolveStorageUrl(
        enriched.student_photo_url,
        BUCKET_PHOTOS
      );
      enriched.student_photo_url = resolved;
    }
  }

  return enriched;
}

/**
 * Get certificate by student ID or registration number (case-insensitive, trimmed).
 * Used for public verification portal search.
 */
export async function getCertificateByStudentId(
  query: string
): Promise<CertificateRecord | null> {
  const cleanId = query.trim();
  if (!cleanId) return null;

  // 1. Try Supabase first
  const supabase = getSupabaseClient() || getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .or(`student_id.eq.${cleanId},registration_number.eq.${cleanId}`)
        .maybeSingle();

      if (error) {
        console.error("[Supabase getCertificateByStudentId Error]:", error.message);
      } else if (data) {
        return await enrichCertificateUrls(data as CertificateRecord);
      }
    } catch (err) {
      console.error("[Supabase getCertificateByStudentId Exception]:", err);
    }
  }

  // 2. Fallback to local JSON if database returned nothing
  const localList = readLocalJson();
  const match = localList.find(
    (item) =>
      item.student_id.toLowerCase() === cleanId.toLowerCase() ||
      (item.registration_number &&
        item.registration_number.toLowerCase() === cleanId.toLowerCase())
  );

  return match ? await enrichCertificateUrls(match) : null;
}

/**
 * Get all certificates for admin dashboard.
 */
export async function getAllCertificates(): Promise<CertificateRecord[]> {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Supabase getAllCertificates Error]:", error.message);
      } else if (data && data.length > 0) {
        return await Promise.all(
          data.map((c) => enrichCertificateUrls(c as CertificateRecord))
        );
      }
    } catch (err) {
      console.error("[Supabase getAllCertificates Exception]:", err);
    }
  }

  const localList = readLocalJson();
  return await Promise.all(localList.map((c) => enrichCertificateUrls(c)));
}

/**
 * Get certificate by ID (UUID) or student ID.
 */
export async function getCertificateById(
  idOrStudentId: string
): Promise<CertificateRecord | null> {
  const clean = idOrStudentId.trim();
  if (!clean) return null;

  const supabase = getSupabaseAdminClient() || getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from("certificates").select("*");

      if (isUUID(clean)) {
        query = query.or(`id.eq.${clean},student_id.eq.${clean}`);
      } else {
        query = query.or(`student_id.eq.${clean},registration_number.eq.${clean}`);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error("[Supabase getCertificateById Error]:", error.message);
      } else if (data) {
        return await enrichCertificateUrls(data as CertificateRecord);
      }
    } catch (err) {
      console.error("[Supabase getCertificateById Exception]:", err);
    }
  }

  const localList = readLocalJson();
  const match = localList.find(
    (item) => item.id === clean || item.student_id === clean
  );
  return match ? await enrichCertificateUrls(match) : null;
}

/**
 * Create a new certificate record in Supabase database.
 */
export async function createCertificate(
  payload: CertificateRecord
): Promise<CertificateRecord> {
  const now = new Date().toISOString();

  // Clean and prepare database record
  // CRITICAL: Do NOT pass non-UUID strings to 'id' column!
  const recordToInsert: Record<string, unknown> = {
    student_id: payload.student_id.trim(),
    student_name: payload.student_name.trim(),
    date_of_birth: payload.date_of_birth?.trim() || null,
    registration_number: payload.registration_number?.trim() || null,
    father_name: payload.father_name?.trim() || null,
    mother_name: payload.mother_name?.trim() || null,
    major_subject: payload.major_subject?.trim() || null,
    cgpa: payload.cgpa?.trim() || null,
    issue_date: payload.issue_date?.trim() || null,
    student_photo_url: payload.student_photo_url?.trim() || null,
    certificate_image_url: payload.certificate_image_url?.trim() || null,
    certificate_pdf_url: payload.certificate_pdf_url?.trim() || null,
    degree_title: payload.degree_title?.trim() || "Bachelor of Business Administration",
    institution_name:
      payload.institution_name?.trim() ||
      "University of Development Alternative",
    status: payload.status || "verified",
    created_at: payload.created_at || now,
    updated_at: now,
  };

  // If a valid UUID is explicitly supplied, include it; otherwise let PostgreSQL gen_random_uuid() generate it
  if (payload.id && isUUID(payload.id)) {
    recordToInsert.id = payload.id;
  }

  // 1. Insert into Supabase with Admin Client
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("certificates")
      .insert(recordToInsert)
      .select()
      .single();

    if (error) {
      console.error("[Supabase createCertificate Database Error]:", error);
      throw new Error(`Database error creating certificate: ${error.message}`);
    }

    if (data) {
      const savedRecord = data as CertificateRecord;

      // Update local backup copy
      const localList = readLocalJson();
      writeLocalJson([
        savedRecord,
        ...localList.filter((x) => x.student_id !== savedRecord.student_id),
      ]);

      return await enrichCertificateUrls(savedRecord);
    }
  }

  // 2. Fallback to local JSON if no database client configured
  const localRecord: CertificateRecord = {
    ...(recordToInsert as unknown as CertificateRecord),
    id: payload.id || `local_${Date.now()}`,
  };
  const list = readLocalJson();
  const existingIdx = list.findIndex(
    (x) => x.student_id.toLowerCase() === localRecord.student_id.toLowerCase()
  );
  if (existingIdx >= 0) {
    list[existingIdx] = localRecord;
  } else {
    list.unshift(localRecord);
  }
  writeLocalJson(list);

  return localRecord;
}

/**
 * Update an existing certificate record in Supabase database.
 */
export async function updateCertificate(
  idOrStudentId: string,
  payload: Partial<CertificateRecord>
): Promise<CertificateRecord | null> {
  const clean = idOrStudentId.trim();
  const updatedTime = new Date().toISOString();

  // Strip 'id' from update payload to prevent primary key alteration
  const { id: _ignoredId, ...updateFields } = payload;

  const fieldsToUpdate: Record<string, unknown> = {
    ...updateFields,
    updated_at: updatedTime,
  };

  // Clean empty strings to null for document fields if explicitly passed
  if ("certificate_image_url" in fieldsToUpdate && !fieldsToUpdate.certificate_image_url) {
    fieldsToUpdate.certificate_image_url = null;
  }
  if ("certificate_pdf_url" in fieldsToUpdate && !fieldsToUpdate.certificate_pdf_url) {
    fieldsToUpdate.certificate_pdf_url = null;
  }

  // 1. Update in Supabase
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    let query = supabase.from("certificates").update(fieldsToUpdate);

    if (isUUID(clean)) {
      query = query.eq("id", clean);
    } else {
      query = query.eq("student_id", clean);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error("[Supabase updateCertificate Error]:", error.message);
      throw new Error(`Database error updating certificate: ${error.message}`);
    }

    if (data) {
      const updated = data as CertificateRecord;
      const list = readLocalJson();
      const idx = list.findIndex(
        (x) => x.id === clean || x.student_id === clean
      );
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.unshift(updated);
      }
      writeLocalJson(list);

      return await enrichCertificateUrls(updated);
    }
  }

  // 2. Local JSON fallback
  const list = readLocalJson();
  const idx = list.findIndex(
    (x) => x.id === clean || x.student_id === clean
  );
  if (idx < 0) return null;

  list[idx] = {
    ...list[idx],
    ...fieldsToUpdate,
  };
  writeLocalJson(list);

  return await enrichCertificateUrls(list[idx]);
}

/**
 * Delete a certificate record from Supabase database.
 */
export async function deleteCertificate(idOrStudentId: string): Promise<boolean> {
  const clean = idOrStudentId.trim();
  if (!clean) return false;

  // 1. Delete in Supabase
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    let query = supabase.from("certificates").delete();

    if (isUUID(clean)) {
      query = query.eq("id", clean);
    } else {
      query = query.eq("student_id", clean);
    }

    const { error } = await query;
    if (error) {
      console.error("[Supabase deleteCertificate Error]:", error.message);
      throw new Error(`Database error deleting certificate: ${error.message}`);
    }
  }

  // 2. Update local JSON backup
  const list = readLocalJson();
  const filtered = list.filter(
    (x) => x.id !== clean && x.student_id !== clean
  );
  writeLocalJson(filtered);

  return true;
}
