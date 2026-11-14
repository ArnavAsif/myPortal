import { NextRequest, NextResponse } from "next/server";
import { getAllCertificates, createCertificate } from "@/lib/certificates";
import { CertificateRecord } from "@/types/certificate";

export async function GET() {
  try {
    const list = await getAllCertificates();
    return NextResponse.json({ success: true, data: list });
  } catch (err: unknown) {
    console.error("Fetch certificates error:", err);
    return NextResponse.json(
      { error: "Failed to fetch certificates." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CertificateRecord = await request.json();

    if (!body.student_id || !body.student_name) {
      return NextResponse.json(
        { error: "Student ID and Student Name are required." },
        { status: 400 }
      );
    }

    const created = await createCertificate(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: unknown) {
    console.error("Create certificate error:", err);
    return NextResponse.json(
      { error: "Failed to create certificate." },
      { status: 500 }
    );
  }
}
