import React, { Suspense } from "react";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata = {
  title: "Admin Panel | UODA Certificate Portal",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9]">
          <div className="w-8 h-8 border-4 border-[#12284c] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Suspense>
  );
}
