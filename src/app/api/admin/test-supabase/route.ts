import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      connected: false,
      tableFound: false,
      message: "Supabase environment variables are missing in .env.local",
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("certificates")
      .select("student_id")
      .limit(1);

    if (error) {
      if (error.code === "PGRST205" || error.message.includes("does not exist")) {
        return NextResponse.json({
          connected: true,
          tableFound: false,
          message: "Connected to Supabase! However, the 'certificates' table has not been created yet.",
          details: error.message,
        });
      }
      return NextResponse.json({
        connected: false,
        tableFound: false,
        message: `Supabase query error: ${error.message}`,
        details: error.code,
      });
    }

    return NextResponse.json({
      connected: true,
      tableFound: true,
      message: "Successfully connected to Supabase and verified 'certificates' table!",
      count: data?.length || 0,
    });
  } catch (err: unknown) {
    return NextResponse.json({
      connected: false,
      tableFound: false,
      message: `Failed to connect to Supabase: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}
