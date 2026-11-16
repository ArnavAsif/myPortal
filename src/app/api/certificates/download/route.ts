import { NextRequest, NextResponse } from "next/server";
import { getCertificateById } from "@/lib/certificates";
import { getSupabaseAdminClient } from "@/lib/supabaseServer";
import {
  BUCKET_CERTIFICATES,
  extractStoragePath,
  hasUploadedCertificateDocument,
  isPdfDocument,
} from "@/lib/storage";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !id.trim()) {
    return NextResponse.json({ error: "Certificate ID is required" }, { status: 400 });
  }

  try {
    const cert = await getCertificateById(id.trim());
    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    if (!hasUploadedCertificateDocument(cert)) {
      return NextResponse.json(
        { error: "No uploaded certificate document exists for this record." },
        { status: 404 }
      );
    }

    const docUrlOrPath = (cert.certificate_pdf_url || cert.certificate_image_url || "").trim();
    const isPdf = isPdfDocument(docUrlOrPath);
    const ext = isPdf ? ".pdf" : (docUrlOrPath.split("?")[0].match(/\.(jpg|jpeg|png|webp)$/i)?.[0] || ".jpg");

    const cleanName = cert.student_name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const downloadFileName = `${cleanName}_Certificate_${cert.student_id}${ext}`;

    const adminClient = getSupabaseAdminClient();
    const objectPath = extractStoragePath(docUrlOrPath, BUCKET_CERTIFICATES);

    // 1. If it's a Supabase storage path and admin client available, download directly from storage
    if (adminClient && !objectPath.startsWith("http://") && !objectPath.startsWith("https://")) {
      const { data: blob, error: downloadError } = await adminClient.storage
        .from(BUCKET_CERTIFICATES)
        .download(objectPath);

      if (!downloadError && blob) {
        const buffer = Buffer.from(await blob.arrayBuffer());
        const contentType = blob.type || (isPdf ? "application/pdf" : "image/jpeg");

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${downloadFileName}"`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    // 2. If it's a full URL, fetch and stream
    if (docUrlOrPath.startsWith("http://") || docUrlOrPath.startsWith("https://")) {
      const remoteRes = await fetch(docUrlOrPath);
      if (remoteRes.ok) {
        const buffer = Buffer.from(await remoteRes.arrayBuffer());
        const contentType =
          remoteRes.headers.get("content-type") ||
          (isPdf ? "application/pdf" : "image/jpeg");

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `attachment; filename="${downloadFileName}"`,
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    }

    return NextResponse.json(
      { error: "Failed to retrieve the certificate file." },
      { status: 500 }
    );
  } catch (err: unknown) {
    console.error("[Download Route Error]:", err);
    return NextResponse.json(
      { error: "Internal server error while downloading document." },
      { status: 500 }
    );
  }
}
