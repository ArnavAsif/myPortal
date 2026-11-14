import fs from "fs";
import path from "path";
import { CertificateRecord } from "@/types/certificate";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create standalone supabase client for server-side operations
const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) return null;
  return createSupabaseClient(supabaseUrl, supabaseKey);
};

const JSON_FILE_PATH = path.join(process.cwd(), "data", "certificates.json");

// Read local JSON fallback
function readLocalJson(): CertificateRecord[] {
  try {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      return [];
    }
    const content = fs.readFileSync(JSON_FILE_PATH, "utf-8");
    return JSON.parse(content) as CertificateRecord[];
  } catch (err) {
    console.error("Error reading local JSON:", err);
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
    console.error("Error writing local JSON:", err);
  }
}

/**
 * Get certificate by student ID (trimmed, case-insensitive)
 */
export async function getCertificateByStudentId(
  studentId: string
): Promise<CertificateRecord | null> {
  const cleanId = studentId.trim();
  if (!cleanId) return null;

  // 1. Try Supabase first
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .eq("student_id", cleanId)
        .maybeSingle();

      if (!error && data) {
        return data as CertificateRecord;
      }
    } catch {
      // Supabase table may not exist yet, fallback to JSON
    }
  }

  // 2. Fallback to local JSON
  const localList = readLocalJson();
  const match = localList.find(
    (item) => item.student_id.toLowerCase() === cleanId.toLowerCase()
  );
  return match || null;
}

/**
 * Get all certificates for admin panel
 */
export async function getAllCertificates(): Promise<CertificateRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as CertificateRecord[];
      }
    } catch {
      // Fallback
    }
  }

  return readLocalJson();
}

/**
 * Get certificate by ID or student ID
 */
export async function getCertificateById(id: string): Promise<CertificateRecord | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .select("*")
        .or(`id.eq.${id},student_id.eq.${id}`)
        .maybeSingle();

      if (!error && data) {
        return data as CertificateRecord;
      }
    } catch {
      // Fallback
    }
  }

  const localList = readLocalJson();
  return (
    localList.find((item) => item.id === id || item.student_id === id) || null
  );
}

/**
 * Create a new certificate record
 */
export async function createCertificate(
  payload: CertificateRecord
): Promise<CertificateRecord> {
  const newRecord: CertificateRecord = {
    ...payload,
    id: payload.id || `cert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: payload.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: payload.status || "verified",
  };

  // 1. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .insert(newRecord)
        .select()
        .single();

      if (!error && data) {
        // Also update local copy
        const list = readLocalJson();
        writeLocalJson([data as CertificateRecord, ...list.filter((x) => x.student_id !== data.student_id)]);
        return data as CertificateRecord;
      }
    } catch {
      // Fall through to local
    }
  }

  // 2. Update local JSON
  const list = readLocalJson();
  // Check duplicate
  const existingIdx = list.findIndex(
    (x) => x.student_id.toLowerCase() === newRecord.student_id.toLowerCase()
  );
  if (existingIdx >= 0) {
    list[existingIdx] = newRecord;
  } else {
    list.unshift(newRecord);
  }
  writeLocalJson(list);
  return newRecord;
}

/**
 * Update an existing certificate record
 */
export async function updateCertificate(
  idOrStudentId: string,
  payload: Partial<CertificateRecord>
): Promise<CertificateRecord | null> {
  const updatedTime = new Date().toISOString();

  // 1. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("certificates")
        .update({
          ...payload,
          updated_at: updatedTime,
        })
        .or(`id.eq.${idOrStudentId},student_id.eq.${idOrStudentId}`)
        .select()
        .single();

      if (!error && data) {
        // Also update local
        const list = readLocalJson();
        const idx = list.findIndex(
          (x) => x.id === idOrStudentId || x.student_id === idOrStudentId
        );
        if (idx >= 0) {
          list[idx] = data as CertificateRecord;
        } else {
          list.unshift(data as CertificateRecord);
        }
        writeLocalJson(list);
        return data as CertificateRecord;
      }
    } catch {
      // Fallback
    }
  }

  // 2. Local JSON
  const list = readLocalJson();
  const idx = list.findIndex(
    (x) => x.id === idOrStudentId || x.student_id === idOrStudentId
  );
  if (idx < 0) return null;

  list[idx] = {
    ...list[idx],
    ...payload,
    updated_at: updatedTime,
  };
  writeLocalJson(list);
  return list[idx];
}

/**
 * Delete a certificate record
 */
export async function deleteCertificate(idOrStudentId: string): Promise<boolean> {
  // 1. Try Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from("certificates")
        .delete()
        .or(`id.eq.${idOrStudentId},student_id.eq.${idOrStudentId}`);
    } catch {
      // Fallback
    }
  }

  // 2. Local JSON
  const list = readLocalJson();
  const filtered = list.filter(
    (x) => x.id !== idOrStudentId && x.student_id !== idOrStudentId
  );
  writeLocalJson(filtered);
  return true;
}
