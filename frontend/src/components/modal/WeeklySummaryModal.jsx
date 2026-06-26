"use client";

import { useScrollLock } from "@/hooks/useScrollLock";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6]; // Lun–Sáb

function buildDayBars(appointments = []) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  appointments.forEach((a) => {
    const day = new Date(a.appointmentDate).getDay();
    if (day >= 1 && day <= 6) counts[day]++;
  });
  const max = Math.max(...Object.values(counts), 1);
  return WEEK_ORDER.map((d) => ({ label: DAY_NAMES[d], count: counts[d], pct: Math.round((counts[d] / max) * 100) }));
}

export default function WeeklySummaryModal({ isOpen, onClose, weeklySummary = null, appointments = [], isAdmin = false }) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const total = weeklySummary?.total ?? 0;
  const confirmed = weeklySummary?.confirmed ?? 0;
  const revenue = weeklySummary?.revenue ?? 0;
  const cancelled = appointments.filter((a) => a.status === "CANCELLED").length;
  const bars = buildDayBars(appointments);

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
              <div className="w-2 h-2 bg-teal-400 rounded-full" />
              <h2 className="text-base font-black text-slate-800">Resumen de la Semana</h2>
            </div>
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
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-3xl font-black text-slate-900 leading-none">{total}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Total citas</p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <p className="text-3xl font-black text-teal-500 leading-none">{confirmed}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Confirmadas</p>
            </div>
            {isAdmin && (
              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-2xl font-black text-emerald-600 leading-none">
                  ${revenue.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide mt-1">Ingresos cobrados</p>
              </div>
            )}
            <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
              <p className="text-3xl font-black text-rose-500 leading-none">{cancelled}</p>
              <p className="text-[10px] font-bold text-rose-300 uppercase tracking-wide mt-1">Cancelaciones</p>
            </div>
          </div>

          {/* Day bars */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Citas por día</p>
            <div className="space-y-2.5">
              {bars.map(({ label, count, pct }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-500 w-7 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 w-4 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
