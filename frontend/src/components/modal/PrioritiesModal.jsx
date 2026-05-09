"use client";

import { useScrollLock } from "@/hooks/useScrollLock";

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

function getInitials(name = "") {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function AppointmentRow({ appt, isUrgent }) {
  const colors = isUrgent
    ? { avatar: "bg-rose-100 text-rose-600", row: "bg-rose-50 border-rose-100", badge: "bg-rose-100 text-rose-700", border: "border-l-rose-400" }
    : { avatar: "bg-amber-100 text-amber-700", row: "bg-amber-50 border-amber-100", badge: "bg-amber-100 text-amber-700", border: "border-l-amber-400" };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl border border-l-4 ${colors.row} ${colors.border}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${colors.avatar}`}>
        {getInitials(appt.patientId?.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-black text-sm text-slate-800 truncate">{appt.patientId?.name || "Paciente"}</p>
        <p className="text-[10px] text-slate-400">
          {formatDate(appt.appointmentDate)} · {formatTime(appt.appointmentDate)}
          {appt.treatmentName && ` · ${appt.treatmentName}`}
        </p>
      </div>
      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${colors.badge}`}>
        {isUrgent ? "URGENTE" : "PRIO"}
      </span>
    </div>
  );
}

export default function PrioritiesModal({ isOpen, onClose, priorityAppointments = [] }) {
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const urgent = priorityAppointments.filter((a) => a.isUrgent);
  const priority = priorityAppointments.filter((a) => !a.isUrgent);

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
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <h2 className="text-base font-black text-slate-800">Lista de Prioridad</h2>
            </div>
            <div className="flex items-center gap-2 pl-4">
              {urgent.length > 0 && (
                <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                  {urgent.length} urgente{urgent.length !== 1 ? "s" : ""}
                </span>
              )}
              {priority.length > 0 && (
                <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                  {priority.length} prioritari{priority.length !== 1 ? "as" : "a"}
                </span>
              )}
              {priorityAppointments.length === 0 && (
                <span className="text-xs text-slate-400">Sin citas prioritarias</span>
              )}
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
          {priorityAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-slate-400 text-sm">Sin citas prioritarias esta semana</p>
            </div>
          ) : (
            <>
              {urgent.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Urgentes</p>
                  {urgent.map((appt) => (
                    <AppointmentRow key={appt._id} appt={appt} isUrgent={true} />
                  ))}
                </div>
              )}
              {priority.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Prioritarias</p>
                  {priority.map((appt) => (
                    <AppointmentRow key={appt._id} appt={appt} isUrgent={false} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
