"use client";
import { X, IdentificationCard, ActivityIcon, PenNib, Tag, NotePencil, Pill } from "@phosphor-icons/react";

const FileHeader = ({ patient, activeTab, setActiveTab, onClose }) => {
  const tabs = [
    { id: "history", label: "Historial", icon: IdentificationCard },
    { id: "evolution", label: "Evolución", icon: ActivityIcon },
    { id: "postOpNotes", label: "Post-Op", icon: NotePencil },
    { id: "prescriptions", label: "Recetas", icon: Pill },
    { id: "signatures", label: "Firmas", icon: PenNib },
    { id: "coupons", label: "Cupones", icon: Tag },
  ];

  const typeStyles = {
    SURGERY: "bg-rose-500 shadow-rose-200",
    SPA: "bg-emerald-500 shadow-emerald-200",
    INJECTION: "bg-purple-500 shadow-purple-200",
    DEFAULT: "bg-indigo-600 shadow-indigo-200",
  };

  const currentStyle = typeStyles[patient?.patientType] || typeStyles.DEFAULT;

  return (
    <header className="p-4 md:p-10 border-b border-slate-50 flex flex-col gap-6 relative bg-white">
      {/* 👤 INFO PACIENTE */}
      <div className="flex items-center gap-4 md:gap-6 mt-4 md:mt-0">
        <div
          className={`w-14 h-14 md:w-16 md:h-16 ${currentStyle} rounded-2xl md:rounded-3xl flex items-center justify-center text-white text-xl md:text-2xl font-black italic shadow-lg transition-all duration-500 shrink-0`}
        >
          {patient?.name?.charAt(0).toUpperCase() || "P"}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-3xl font-black italic uppercase text-slate-900 leading-tight truncate">
            {patient?.name || "Cargando..."}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 uppercase tracking-widest">
              ID: {patient?.referralCode || "---"}
            </span>
            <p className="hidden xs:block text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
              • Expediente Digital
            </p>
          </div>
        </div>
      </div>

      {/* 🚥 NAVEGACIÓN RESPONSIVA */}
      <nav className="grid grid-cols-6 gap-2 bg-slate-100/50 p-1.5 rounded-4xl w-full md:w-fit md:flex md:self-end">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 
              px-2 py-3 md:px-6 md:py-3 rounded-3xl md:rounded-xl 
              text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all
              ${
                activeTab === tab.id
                  ? "bg-white text-indigo-600 shadow-sm scale-100"
                  : "text-slate-400 hover:text-slate-600 active:scale-95"
              }
            `}
          >
            <tab.icon
              size={18}
              weight={activeTab === tab.id ? "fill" : "bold"}
            />
            <span className="leading-none text-center">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ❌ BOTÓN CERRAR */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
      >
        <X size={20} weight="bold" />
      </button>
    </header>
  );
};

export default FileHeader;
