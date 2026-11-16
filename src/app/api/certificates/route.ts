import { NextRequest, NextResponse } from "next/server";
import { getAllCertificates, createCertificate } from "@/lib/certificates";
import { CertificateRecord } from "@/types/certificate";

export async function GET() {
  try {
    const list = await getAllCertificates();
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    console.error("[GET /api/certificates Error]:", err);
    return NextResponse.json(
      { error: "Failed to fetch certificates." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("uoda_admin_session");
    if (sessionCookie?.value !== "authenticated") {
      return NextResponse.json(
        { error: "Unauthorized access. Please log in to create certificates." },
        { status: 401 }
      );
    }

    const body: CertificateRecord = await request.json();

    if (!body.student_id?.trim() || !body.student_name?.trim()) {
      return NextResponse.json(
        { error: "Student ID and Student Name are required fields." },
        { status: 400 }
      );
    }

    const created = await createCertificate(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/certificates Error]:", err);
    const message = err instanceof Error ? err.message : "Failed to create certificate.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
