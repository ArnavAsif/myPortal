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
    console.error("Get certificate error:", err);
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
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await updateCertificate(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Certificate not found to update" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: unknown) {
    console.error("Update certificate error:", err);
    return NextResponse.json(
      { error: "Failed to update certificate" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await deleteCertificate(id);
    return NextResponse.json({
      success: true,
      message: "Certificate deleted successfully",
    });
  } catch (err: unknown) {
    console.error("Delete certificate error:", err);
    return NextResponse.json(
      { error: "Failed to delete certificate" },
      { status: 500 }
    );
  }
}
