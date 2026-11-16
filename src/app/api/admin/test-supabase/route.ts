import { NextResponse } from "next/server";
import {
  getSupabaseAdminClient,
  getSupabaseClient,
  hasServiceRoleKey,
  supabaseUrl,
} from "@/lib/supabaseServer";
import { BUCKET_CERTIFICATES } from "@/lib/storage";

export async function GET() {
  const supabase = getSupabaseAdminClient() || getSupabaseClient();

  if (!supabase || !supabaseUrl) {
    return NextResponse.json({
      connected: false,
      tableFound: false,
      storageFound: false,
      serviceRoleConfigured: false,
      message: "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / key) are missing.",
    });
  }

  const serviceRoleOk = hasServiceRoleKey();

  try {
    // 1. Test database table
    const { data: certData, error: dbError } = await supabase
      .from("certificates")
      .select("student_id")
      .limit(1);

    if (dbError) {
      if (dbError.code === "PGRST205" || dbError.message.includes("does not exist")) {
        return NextResponse.json({
          connected: true,
          tableFound: false,
          storageFound: false,
          serviceRoleConfigured: serviceRoleOk,
          message: "Connected to Supabase! However, the 'public.certificates' table has not been created yet.",
          details: dbError.message,
        });
      }
      return NextResponse.json({
        connected: false,
        tableFound: false,
        storageFound: false,
        serviceRoleConfigured: serviceRoleOk,
        message: `Supabase database query error: ${dbError.message}`,
        details: dbError.code,
      });
    }

    // 2. Test storage bucket
    let storageFound = false;
    let storageDetails = "";
    try {
      const { data: files, error: storageErr } = await supabase.storage
        .from(BUCKET_CERTIFICATES)
        .list("", { limit: 1 });

      if (!storageErr) {
        storageFound = true;
      } else {
        storageDetails = storageErr.message;
      }
    } catch (sErr) {
      storageDetails = sErr instanceof Error ? sErr.message : String(sErr);
    }

    return NextResponse.json({
      connected: true,
      tableFound: true,
      storageFound,
      serviceRoleConfigured: serviceRoleOk,
      message: "Successfully connected to Supabase and verified 'certificates' table!",
      details: storageFound
        ? `Storage bucket '${BUCKET_CERTIFICATES}' is verified.`
        : `Bucket '${BUCKET_CERTIFICATES}' status: ${storageDetails || "Pending policy check"}`,
      count: certData?.length || 0,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      connected: false,
      tableFound: false,
      storageFound: false,
      serviceRoleConfigured: serviceRoleOk,
      message: `Failed to connect to Supabase: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
