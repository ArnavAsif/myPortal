import { NextRequest, NextResponse } from "next/server";
import {
  getCertificateById,
  updateCertificate,
  deleteCertificate,
} from "@/lib/certificates";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const cert = await getCertificateById(id);
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: cert });
  } catch (err: unknown) {
    console.error("[GET /api/certificates/[id] Error]:", err);
    return NextResponse.json(
      { error: "Failed to fetch certificate" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionCookie = request.cookies.get("uoda_admin_session");
  if (sessionCookie?.value !== "authenticated") {
    return NextResponse.json(
      { error: "Unauthorized access. Please log in to edit certificates." },
      { status: 401 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await updateCertificate(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Certificate record not found to update" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    console.error("[PUT /api/certificates/[id] Error]:", err);
    const message = err instanceof Error ? err.message : "Failed to update certificate";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionCookie = request.cookies.get("uoda_admin_session");
  if (sessionCookie?.value !== "authenticated") {
    return NextResponse.json(
      { error: "Unauthorized access. Please log in to delete certificates." },
      { status: 401 }
    );
  }

  const { id } = await params;
  try {
    await deleteCertificate(id);
    return NextResponse.json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (err: unknown) {
    console.error("[DELETE /api/certificates/[id] Error]:", err);
    const message = err instanceof Error ? err.message : "Failed to delete certificate";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
