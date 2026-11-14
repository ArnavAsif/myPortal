"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Database,
  ExternalLink,
  LogOut,
  X,
  FileCheck2,
} from "lucide-react";

export default function AdminSidebar({
  isMobileOpen,
  onCloseMobile,
}: {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  const navItems = [
    {
      label: "Certificates Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Add New Student Record",
      href: "/admin/certificates/new",
      icon: PlusCircle,
    },
    {
      label: "Supabase & Database",
      href: "/admin/settings",
      icon: Database,
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#12284c] text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand / Logo */}
        <div className="h-18 px-5 border-b border-blue-900/60 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-full bg-white p-1 flex items-center justify-center shrink-0 border border-amber-400/40">
              <Image
                src="/images/uoda-logo.svg"
                alt="UODA Logo"
                width={36}
                height={36}
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
                UODA Admin
              </span>
              <span className="text-sm font-bold text-white tracking-tight">
                Certificate Portal
              </span>
            </div>
          </Link>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-[#cca23b] text-[#12284c] font-bold shadow-sm"
                    : "text-slate-200 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-[#12284c]" : "text-amber-400"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 pb-2">
            <div className="border-t border-blue-900/60 mx-1 mb-3" />
            <span className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Live Website
            </span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition group"
          >
            <span className="flex items-center gap-3">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Public Verification</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </Link>
        </nav>

        {/* User / Logout */}
        <div className="p-4 border-t border-blue-900/60 bg-[#0d1d38]">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Administrator</span>
              <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                admin@uoda.edu.bd
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg bg-white/10 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
