import { NextRequest, NextResponse } from "next/server";
import { getCertificateByStudentId } from "@/lib/certificates";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !id.trim()) {
    return NextResponse.json(
      { error: "Student ID is required." },
      { status: 400 }
    );
  }

  try {
    const certificate = await getCertificateByStudentId(id.trim());

    if (!certificate) {
      return NextResponse.json(
        { error: "No certificate found for that number. Please check it and try again." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: certificate,
    });
  } catch (err: unknown) {
    console.error("Verification error:", err);
    return NextResponse.json(
      { error: "Internal server error during verification." },
      { status: 500 }
    );
  }
}
