import { NextResponse } from "next/server";
import { createCertificate } from "@/lib/certificates";

export async function POST() {
  try {
    const sampleRecord = {
      student_id: "789107238548",
      student_name: "Tania Akter",
      date_of_birth: "09 Sep 1992",
      registration_number: "358737",
      father_name: "Rafiqul Islam",
      mother_name: "Nahar Begum",
      major_subject: "Bachelor of Business Administration (BBA)",
      cgpa: "3.25",
      issue_date: "2020-12-01",
      student_photo_url: "/sample/tania_akter_photo.svg",
      certificate_image_url: null,
      certificate_pdf_url: null,
      degree_title: "Bachelor of Business Administration",
      institution_name: "University of Development Alternative",
      status: "verified",
    };

    await createCertificate(sampleRecord);

    return NextResponse.json({
      success: true,
      message: "Sample record for Tania Akter (789107238548) successfully seeded!",
      data: sampleRecord,
    });
  } catch (err: unknown) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
