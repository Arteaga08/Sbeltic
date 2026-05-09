"use client";

import { useScrollLock } from "@/hooks/useScrollLock";

function getDaysWaiting(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "1 día";
  return `${diff} días`;
}

function getInitials(name = "") {
  return name.trim().charAt(0).toUpperCase() || "?";
}

const STATUS_CONFIG = {
  WAITING: { label: "En espera", bg: "bg-violet-100", text: "text-violet-700" },
  CONTACTED: { label: "Contactado", bg: "bg-emerald-100", text: "text-emerald-700" },
  SCHEDULED: { label: "Agendado", bg: "bg-blue-100", text: "text-blue-700" },
};

export default function WaitlistModal({ isOpen, onClose, waitlist = [] }) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const visible = waitlist.filter((w) => w.status === "WAITING" || w.status === "CONTACTED");

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 bg-violet-400 rounded-full" />
              <h2 className="text-base font-black text-slate-800">Lista de Espera</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium pl-4">
              {visible.length} paciente{visible.length !== 1 ? "s" : ""} en espera
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
          >
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
          {visible.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm">Sin pacientes en lista de espera</p>
            </div>
          ) : (
            visible.map((entry, idx) => {
              const s = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.WAITING;
              const waiting = getDaysWaiting(entry.createdAt);
              return (
                <div key={entry._id} className="flex items-center gap-3 p-3 bg-violet-50 rounded-2xl border border-violet-100">
                  <span className="text-[10px] font-black text-violet-400 w-5 text-center shrink-0">#{idx + 1}</span>
                  <div className="w-8 h-8 bg-violet-200 rounded-full flex items-center justify-center text-xs font-black text-violet-700 shrink-0">
                    {getInitials(entry.patientId?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm text-slate-800 truncate">{entry.patientId?.name || "Paciente"}</p>
                    <p className="text-[10px] text-slate-400">
                      {entry.treatmentId?.name || entry.notes || "Tratamiento no especificado"}
                      {waiting && ` · ${waiting}`}
                    </p>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${s.bg} ${s.text}`}>
                    {s.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
