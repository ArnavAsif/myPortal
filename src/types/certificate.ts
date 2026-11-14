export interface CertificateRecord {
  id?: string;
  student_id: string;
  student_name: string;
  date_of_birth?: string | null;
  registration_number?: string | null;
  father_name?: string | null;
  mother_name?: string | null;
  major_subject?: string | null;
  cgpa?: string | null;
  issue_date?: string | null;
  student_photo_url?: string | null;
  certificate_image_url?: string | null;
  certificate_pdf_url?: string | null;
  degree_title?: string | null;
  institution_name?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CertificateFieldKey = keyof Omit<
  CertificateRecord,
  "id" | "created_at" | "updated_at" | "status" | "student_photo_url" | "certificate_image_url" | "certificate_pdf_url"
>;

export interface CertificateFieldConfig {
  key: CertificateFieldKey;
  label: string;
}

export const DISPLAY_FIELDS: CertificateFieldConfig[] = [
  { key: "student_name", label: "STUDENT NAME" },
  { key: "date_of_birth", label: "DATE OF BIRTH" },
  { key: "student_id", label: "STUDENT ID" },
  { key: "registration_number", label: "REGISTRATION NUMBER" },
  { key: "father_name", label: "FATHER'S NAME" },
  { key: "mother_name", label: "MOTHER'S NAME" },
  { key: "major_subject", label: "MAJOR SUBJECT" },
  { key: "cgpa", label: "CGPA" },
  { key: "issue_date", label: "ISSUE DATE" },
];
