import React from "react";
import { notFound } from "next/navigation";
import CertificateForm from "@/components/admin/CertificateForm";
import { getCertificateById } from "@/lib/certificates";

export const metadata = {
  title: "Edit Certificate | UODA Admin",
};

export default async function EditCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const certificate = await getCertificateById(id);

  if (!certificate) {
    notFound();
  }

  return <CertificateForm initialData={certificate} isEdit={true} />;
}
