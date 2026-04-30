"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const MARKETING_ALLOWED_PREFIXES = ["/marketing", "/agenda"];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("sbeltic_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const userStr = localStorage.getItem("sbeltic_user");
      const user = userStr ? JSON.parse(userStr) : null;
      if (
        user?.role === "MARKETING" &&
        !MARKETING_ALLOWED_PREFIXES.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`),
        )
      ) {
        router.replace("/marketing");
      }
    } catch {
      // si el usuario en storage está corrupto, lo dejamos pasar — el backend rechazará
    }
  }, [router, pathname]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 pb-24 md:pb-8 p-4 md:p-10">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
