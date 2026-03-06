"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
    { name: "Inicio", path: "/", icon: "🏠", roles: ["ADMIN", "RECEPTION"] },
    {
      name: "Agenda",
      path: "/agenda",
      icon: "📅",
      roles: ["ADMIN", "RECEPTION"],
    },
    {
      name: "Pacientes",
      path: "/patients",
      icon: "👥",
      roles: ["ADMIN", "RECEPTION"],
    },
    { name: "Marketing", path: "/marketing", icon: "📢", roles: ["ADMIN"] },
    { name: "Inventario", path: "/inventory", icon: "📦", roles: ["ADMIN"] },
    { name: "Equipo", path: "/equipo", icon: "⚙️", roles: ["ADMIN"] },
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
                <span className="text-xl">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE NAV: Barra inferior elegante con desenfoque */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-around items-center p-3 z-[100] h-20 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {filteredItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center gap-1 flex-1"
            >
              <span
                className={`text-xl transition-all ${isActive ? "scale-110" : "opacity-30 grayscale"}`}
              >
                {item.icon}
              </span>
              <span
                className={`text-[8px] font-black uppercase tracking-tighter ${isActive ? "text-slate-900" : "text-slate-400"}`}
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
