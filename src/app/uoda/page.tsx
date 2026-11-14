import React, { Suspense } from "react";
import VerificationPortal from "@/components/VerificationPortal";

export const metadata = {
  title: "Online Certificate Verification | University of Development Alternative (UODA)",
  description:
    "Official online certificate verification portal authorized by University of Development Alternative (UODA).",
};

export default function UodaVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4f7fb]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#12284c] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-600">
              Loading Verification Portal...
            </span>
          </div>
        </div>
      }
    >
      <VerificationPortal />
    </Suspense>
  );
}
