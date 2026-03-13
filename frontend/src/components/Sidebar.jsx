"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  CalendarCheck,
  Users,
  Megaphone,
  Package,
  Gear,
} from "@phosphor-icons/react";

export default function Sidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("sbeltic_user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Usamos el rol real de tu DB: ADMIN, RECEPTION, etc.
  const userRole = user?.role || "GUEST";

  const menuItems = [
    {
      name: "Inicio",
      path: "/",
      icon: <House size={24} weight="duotone" />,
      roles: ["ADMIN", "RECEPTION"],
      activeColor: "text-indigo-600",
    },
    {
      name: "Agenda",
      path: "/agenda",
      icon: <CalendarCheck size={24} weight="duotone" />,
      roles: ["ADMIN", "RECEPTION"],
      activeColor: "text-purple-600",
    },
    {
      name: "Pacientes",
      path: "/patients",
      icon: <Users size={24} weight="duotone" />,
      roles: ["ADMIN", "RECEPTION"],
      activeColor: "text-rose-600",
    },
    {
      name: "Marketing",
      path: "/marketing",
      icon: <Megaphone size={24} weight="duotone" />,
      roles: ["ADMIN"],
      activeColor: "text-amber-600",
    },
    {
      name: "Inventario",
      path: "/inventory",
      icon: <Package size={24} weight="duotone" />,
      roles: ["ADMIN"],
      activeColor: "text-emerald-600",
    },
    {
      name: "Equipo",
      path: "/equipo",
      icon: <Gear size={24} weight="duotone" />,
      roles: ["ADMIN"],
      activeColor: "text-blue-600",
    },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.roles.includes(userRole),
  );

  return (
    <>
      {/* DESKTOP SIDEBAR: Se queda fijo a la izquierda */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0 p-6 shrink-0">
        <div className="mb-10">
          <h1 className="text-2xl font-black text-slate-900 italic leading-none">
            SBELTIC
          </h1>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Vidix Studio
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {filteredItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${
                  isActive
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className={isActive ? "text-white" : item.activeColor}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE NAV: Barra inferior elegante con desenfoque y z-index máximo */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200 flex justify-around items-center p-3 z-10000 h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] pb-safe">
        {filteredItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center gap-1.5 flex-1 transition-transform active:scale-90"
            >
              <span
                className={`transition-all duration-300 ${
                  isActive
                    ? `scale-110 ${item.activeColor}`
                    : "opacity-40 text-slate-400 grayscale"
                }`}
              >
                {item.icon}
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
