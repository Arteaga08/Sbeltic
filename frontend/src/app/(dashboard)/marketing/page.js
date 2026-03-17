"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  RocketLaunch,
  UsersThree,
  CalendarCheck,
  WarningCircle,
  Megaphone,
  ChartLineUp,
  HandCoins,
} from "@phosphor-icons/react";
import CouponBuilderModal from "@/components/marketing/modals/CouponBuilderModal";
import { toast } from "sonner";

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("WELCOME");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [stats, setStats] = useState({
    conversion: "0%",
    referrals: "0",
    savings: "$0",
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setTimeout(() => {
          setStats({ conversion: "18%", referrals: "42", savings: "$5,300" });
          setLoadingStats(false);
        }, 800);
      } catch (error) {
        toast.error("Error al cargar las estadísticas");
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const tabs = [
    {
      id: "WELCOME",
      label: "Bienvenida",
      icon: RocketLaunch,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: "REFERRAL",
      label: "Referidos",
      icon: UsersThree,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      id: "SEASONAL",
      label: "Promos",
      icon: CalendarCheck,
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      id: "CLEARANCE",
      label: "Outlet",
      icon: WarningCircle,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  return (
    <>
      {/* 🌟 1. REDUCIMOS PADDING INFERIOR Y ESPACIADO (De pb-24 a pb-6 en móvil) */}
      <div className="p-4 md:p-8 space-y-4 md:space-y-8 animate-in fade-in duration-700 pb-6 md:pb-20">
        {/* 🟢 HEADER: Textos más pequeños en móvil para que no empujen todo hacia abajo */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="p-3 md:p-4 bg-slate-900 text-white rounded-xl md:rounded-3xl shadow-lg shadow-slate-200">
              <Megaphone size={20} weight="fill" className="md:w-7 md:h-7" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black italic uppercase text-slate-900 tracking-tighter leading-none">
                Marketing <span className="text-indigo-600">&</span> Lealtad
              </h1>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Sbeltic Growth Engine
              </p>
            </div>
          </div>

          <button
            className="w-full lg:w-auto group flex items-center justify-center gap-2 px-6 py-3.5 md:px-10 md:py-5 bg-indigo-600 text-white rounded-xl md:rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 active:scale-95 shrink-0"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus
              size={16}
              weight="bold"
              className="group-hover:rotate-90 transition-transform duration-500"
            />
            Nueva Campaña
          </button>
        </header>

        {/* 🌟 2. EL SECRETO: En móvil es un SCROLL HORIZONTAL (flex overflow-x-auto), en PC es un Grid */}
        <section className="flex md:grid md:grid-cols-3 gap-3 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
          {[
            {
              label: "Conversión 1ra Visita",
              value: stats.conversion,
              icon: ChartLineUp,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Referidos Activos",
              value: stats.referrals,
              icon: UsersThree,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Ahorro Clientes",
              value: stats.savings,
              icon: HandCoins,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="min-w-[85%] md:min-w-0 snap-center bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 flex items-center gap-3 md:gap-5 shadow-sm shrink-0"
            >
              <div
                className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bg} ${stat.color}`}
              >
                <stat.icon size={20} weight="fill" className="md:w-6 md:h-6" />
              </div>
              <div>
                <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {stat.label}
                </p>
                {loadingStats ? (
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-base md:text-2xl font-black text-slate-900 leading-none">
                    {stat.value}
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* 📑 SELECTOR DE CATEGORÍAS */}
        <nav className="flex items-center gap-2 p-1.5 md:p-2 bg-slate-100/50 rounded-xl md:rounded-3xl border border-slate-100 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 md:px-8 md:py-4 rounded-lg md:rounded-2xl transition-all duration-300 shrink-0 ${
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600 opacity-80"
                }`}
              >
                <div
                  className={`p-1 md:p-2 rounded-md md:rounded-xl transition-colors ${isActive ? tab.bg : "bg-transparent"}`}
                >
                  <tab.icon
                    size={16}
                    weight={isActive ? "fill" : "bold"}
                    className={isActive ? tab.color : ""}
                  />
                </div>
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* 🌟 3. CONTENEDOR PRINCIPAL: Alturas dinámicas sin forzar min-h gigante */}
        <main className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white rounded-3xl md:rounded-[3rem] border border-slate-100 p-5 md:p-12 shadow-sm relative overflow-hidden min-h-62.5 md:min-h-100">
            <div className="absolute top-0 right-0 p-6 md:p-10 opacity-[0.03] pointer-events-none">
              <Megaphone size={120} weight="fill" className="md:w-64 md:h-64" />
            </div>

            {activeTab === "WELCOME" && (
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-base md:text-xl font-black italic uppercase text-slate-900 tracking-tight">
                  Campañas de Bienvenida
                </h3>
                <p className="text-[11px] md:text-sm text-slate-500 max-w-xl">
                  Gestiona los incentivos para pacientes que visitan Sbeltic por
                  primera vez.
                </p>

                <div className="py-10 md:py-20 border-2 border-dashed border-slate-100 rounded-2xl md:rounded-3xl text-center">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Cargando información...
                  </p>
                </div>
              </div>
            )}

            {activeTab !== "WELCOME" && (
              <div className="py-16 md:py-32 text-center">
                <p className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">
                  Configurando módulo de{" "}
                  {tabs.find((t) => t.id === activeTab).label}...
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <CouponBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
