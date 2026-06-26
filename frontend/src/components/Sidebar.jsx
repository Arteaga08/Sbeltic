"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  House,
  CalendarCheck,
  Users,
  Megaphone,
  Package,
  Gear,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API = process.env.NEXT_PUBLIC_API_URL;

// 🌟 TÁCTICA 1: Movimos los items AFUERA del componente.
// Esto le prueba a Snyk que los paths son constantes y NO vienen del usuario/estado.
const MENU_ITEMS = [
  {
    name: "Inicio",
    path: "/",
    icon: <House size={24} weight="duotone" />,
    roles: ["ADMIN", "RECEPTIONIST", "NURSE", "PHYSIOTHERAPIST"],
    activeColor: "text-indigo-600",
  },
  {
    name: "Agenda",
    path: "/agenda",
    icon: <CalendarCheck size={24} weight="duotone" />,
    roles: ["ADMIN", "RECEPTIONIST", "MARKETING", "NURSE", "PHYSIOTHERAPIST"],
    activeColor: "text-purple-600",
  },
  {
    name: "Pacientes",
    path: "/patients",
    icon: <Users size={24} weight="duotone" />,
    roles: ["ADMIN", "RECEPTIONIST", "NURSE", "PHYSIOTHERAPIST"],
    activeColor: "text-rose-600",
  },
  {
    name: "Marketing",
    path: "/marketing",
    icon: <Megaphone size={24} weight="duotone" />,
    roles: ["ADMIN", "RECEPTIONIST", "MARKETING"],
    activeColor: "text-amber-600",
  },
  {
    name: "Inventario",
    path: "/inventory",
    icon: <Package size={24} weight="duotone" />,
    roles: ["ADMIN", "RECEPTIONIST", "NURSE"],
    activeColor: "text-emerald-600",
  },
  {
    name: "Finanzas",
    path: "/finanzas",
    icon: <CurrencyDollar size={24} weight="duotone" />,
    roles: ["ADMIN"],
    activeColor: "text-green-600",
  },
  {
    name: "Equipo",
    path: "/equipo",
    icon: <Gear size={24} weight="duotone" />,
    roles: ["ADMIN"],
    activeColor: "text-blue-600",
  },
];

const ROLE_LABEL = {
  ADMIN: "Administrador",
  RECEPTIONIST: "Recepción",
  DOCTOR: "Doctor",
  MARKETING: "Marketing",
  NURSE: "Enfermería",
  PHYSIOTHERAPIST: "Fisioterapia",
};

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [financePending, setFinancePending] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("sbeltic_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const userRole = user?.role || "GUEST";

  useEffect(() => {
    if (userRole !== "ADMIN") return;
    const now = new Date();
    const params = new URLSearchParams({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
    fetchWithAuth(`${API}/finance/admin-summary?${params}`)
      .then((r) => r.json())
      .then((d) => {
        const total = (d.data?.collaborators || []).reduce(
          (s, c) => s + (c.pendingCount || 0),
          0,
        );
        setFinancePending(total);
      })
      .catch(() => {});
  }, [userRole]);

  // Filtramos usando la constante externa
  const filteredItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(userRole),
  );

  // Mobile nav: máximo 5 ítems, excluimos los marcados como mobileHidden
  const mobileItems = filteredItems.filter((item) => !item.mobileHidden);

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full overflow-y-auto p-6 shrink-0">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Image
              src="/Icon_Sbeltic.jpeg"
              alt="Sbeltic"
              width={36}
              height={36}
              className="rounded-xl"
            />
            <div>
              <h1 className="text-lg font-black text-slate-900 italic leading-none">
                SBELTIC
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Vidix Studio
              </p>
            </div>
          </div>
          {user && (
            <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
              {ROLE_LABEL[user.role] ?? user.role}
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.path;
            const showBadge = item.path === "/finanzas" && financePending > 0;
            return (
              <Link
                key={item.path}
                // 🌟 TÁCTICA 2: Usamos el objeto de ruta nativo de Next.js
                // Esto bloquea inherentemente inyecciones de protocolo (XSS)
                href={{ pathname: item.path }}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`relative ${isActive ? "text-white" : item.activeColor}`}
                >
                  {item.icon}
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-black leading-none">
                      {financePending > 9 ? "9+" : financePending}
                    </span>
                  )}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200 flex justify-around items-center p-3 z-50 h-20 shadow-nav pb-safe">
        {mobileItems.map((item) => {
          const isActive = pathname === item.path;
          const showBadge = item.path === "/finanzas" && financePending > 0;
          return (
            <Link
              key={item.path}
              // 🌟 TÁCTICA 2: Aplicada aquí también
              href={{ pathname: item.path }}
              className="flex flex-col items-center gap-1.5 flex-1 transition-transform active:scale-90"
            >
              <span
                className={`relative transition-all duration-300 ${
                  isActive
                    ? `scale-110 ${item.activeColor}`
                    : "opacity-40 text-slate-400 grayscale"
                }`}
              >
                {item.icon}
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[8px] font-black leading-none">
                    {financePending > 9 ? "9+" : financePending}
                  </span>
                )}
              </span>
              <span
                className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                  isActive ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
