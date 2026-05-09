"use client";

import { useScrollLock } from "@/hooks/useScrollLock";

const STATUS_CONFIG = {
  PENDING: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
  CONFIRMED: { label: "Confirmada", bg: "bg-emerald-100", text: "text-emerald-700" },
  IN_PROGRESS: { label: "En curso", bg: "bg-blue-100", text: "text-blue-700" },
};

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isSame = (a, b) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (isSame(d, today)) return "Hoy";
  if (isSame(d, tomorrow)) return "Mañana";
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
}

export default function SurgeriesModal({ isOpen, onClose, upcomingSurgeries = [] }) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

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
              <div className="w-2 h-2 bg-rose-500 rounded-full" />
              <h2 className="text-base font-black text-slate-800">Próximas Cirugías</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium pl-4">
              {upcomingSurgeries.length} procedimiento{upcomingSurgeries.length !== 1 ? "s" : ""} programado{upcomingSurgeries.length !== 1 ? "s" : ""}
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
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {upcomingSurgeries.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm">Sin cirugías programadas</p>
            </div>
          ) : (
            upcomingSurgeries.map((appt) => {
              const s = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.PENDING;
              return (
                <div key={appt._id} className="flex flex-col gap-2 p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-rose-600 leading-none">{formatTime(appt.appointmentDate)}</span>
                      <span className="text-xs font-bold text-rose-400 uppercase">{formatDate(appt.appointmentDate)}</span>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 ${s.bg} ${s.text}`}>{s.label}</span>
                  </div>
                  <p className="font-black text-sm text-slate-800 leading-tight">{appt.patientId?.name || "Paciente"}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {appt.roomId && (
                      <span className="text-[10px] font-black text-rose-600 uppercase bg-rose-100 px-2 py-0.5 rounded-md">
                        {appt.roomId.replace(/_/g, " ")}
                      </span>
                    )}
                    {appt.treatmentName && (
                      <span className="text-[10px] text-slate-500 truncate">{appt.treatmentName}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
