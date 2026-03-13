"use client";
import {
  Phone,
  EnvelopeSimple,
  IdentificationBadge,
  CaretRight,
  WhatsappLogo,
} from "@phosphor-icons/react";

const typeStyles = {
  SPA: {
    label: "Spa/Retail",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    accent: "bg-emerald-600",
  },
  INJECTION: {
    label: "Inyectables",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    accent: "bg-purple-600",
  },
  LEAD: {
    label: "Cotización",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    accent: "bg-amber-600",
  },
  SURGERY: {
    label: "Cirugía",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    accent: "bg-rose-600",
  },
  POST_OP: {
    label: "Post-Op",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    accent: "bg-blue-600",
  },
  OTHER: {
    label: "Otros",
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-200",
    accent: "bg-slate-500",
  },
};

const PatientCard = ({ patient, onClick }) => {
  const style = typeStyles[patient.patientType] || typeStyles.OTHER;

  return (
    <div
      onClick={() => onClick(patient)}
      className="group cursor-pointer bg-white border border-slate-100 rounded-4xl p-6 hover:shadow-2xl hover:shadow-indigo-100/50 hover:border-indigo-200 transition-all flex flex-col justify-between h-full relative overflow-hidden"
    >
      {/* Barra de acento lateral */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${style.accent} opacity-20 group-hover:opacity-100 transition-opacity`}
      />

      <div>
        <div className="flex items-start justify-between mb-5">
          {/* AVATAR */}
          <div
            className={`w-14 h-14 ${style.bg} ${style.color} rounded-2xl flex items-center justify-center font-black text-xl shadow-inner group-hover:scale-105 transition-transform duration-300`}
          >
            {patient.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${style.bg} ${style.color} ${style.border}`}
            >
              {style.label}
            </span>
            {patient.allowsWhatsAppNotifications && (
              <WhatsappLogo
                size={18}
                weight="fill"
                className="text-emerald-500"
              />
            )}
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-800 uppercase italic leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
          {patient.name}
        </h3>

        <div className="mt-5 space-y-3">
          <p className="flex items-center gap-3 text-sm font-bold text-slate-500">
            <Phone size={16} weight="bold" className="text-slate-300" />
            {patient.phone}
          </p>
          {patient.email && (
            <p className="flex items-center gap-3 text-sm font-bold text-slate-500 truncate">
              <EnvelopeSimple
                size={16}
                weight="bold"
                className="text-slate-300"
              />
              {patient.email}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Ref:{" "}
          <span className="text-slate-800">{patient.referralCode || "—"}</span>
        </div>

        <button className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
          <CaretRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
};

export default PatientCard;
