"use client";
import {
  Sparkle,
  Syringe,
  ClipboardText,
  Heartbeat,
  Gear,
  IdentificationCard,
  CaretRight,
} from "@phosphor-icons/react";

const PatientStats = ({ counts, onSelectCategory }) => {
  const stats = [
    {
      id: "SPA",
      label: "Spa / Retail",
      icon: Sparkle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      id: "INJECTION",
      label: "Inyectables",
      icon: Syringe,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      id: "LEAD",
      label: "Cotización",
      icon: ClipboardText,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      id: "SURGERY",
      label: "Cirugía",
      icon: Heartbeat,
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    },
    {
      id: "POST_OP",
      label: "Post-Op",
      icon: IdentificationCard,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      id: "OTHER",
      label: "Otros / Staff",
      icon: Gear,
      color: "text-slate-500",
      bg: "bg-slate-50",
      border: "border-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <button
            key={stat.id}
            onClick={() => onSelectCategory(stat.id)}
            className="group relative flex flex-col p-7 md:p-10 bg-white border border-slate-100 rounded-[2.5rem] md:rounded-[2.5rem] hover:shadow-2xl hover:shadow-slate-200/60 hover:border-indigo-300 transition-all text-left overflow-hidden active:scale-[0.96]"
          >
            {/* Círculo de fondo decorativo al hacer hover */}
            <div
              className={`absolute -right-6 -top-6 w-32 h-32 ${stat.bg} rounded-full opacity-0 group-hover:opacity-40 transition-all duration-700 scale-0 group-hover:scale-100`}
            />

            <div
              className={`p-4 md:p-5 rounded-2xl md:rounded-3xl w-fit mb-6 md:mb-8 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-500 shadow-sm`}
            >
              <Icon size={32} weight="bold" className="md:w-10 md:h-10" />
            </div>

            <div className="relative z-10">
              <h3 className="text-base md:text-3xl font-black italic uppercase text-slate-800 leading-tight mb-2 md:mb-3">
                {stat.label}
              </h3>
              <div className="flex items-center justify-between mt-3 md:mt-6">
                <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {counts[stat.id] || 0} Registros
                </span>
                <div
                  className={`p-2 rounded-full ${stat.bg} ${stat.color} opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 hidden md:block`}
                >
                  <CaretRight size={16} weight="bold" />
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default PatientStats;
