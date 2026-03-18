"use client";

import { X } from "@phosphor-icons/react";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDesiredDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function SurgeryPanel({ upcomingSurgeries }) {
  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-rose-500 rounded-full" />
        <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-500">
          Próximas Cirugías
        </h3>
      </div>

      {upcomingSurgeries.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Sin cirugías programadas</p>
      ) : (
        <div className="space-y-2">
          {upcomingSurgeries.map((appt) => (
            <div key={appt._id} className="flex items-center gap-3 p-2.5 bg-rose-50 rounded-2xl">
              <div className="text-center shrink-0 w-10">
                <p className="text-sm font-black text-rose-600 leading-none">
                  {formatTime(appt.appointmentDate)}
                </p>
                <p className="text-[8px] text-rose-400 font-bold">
                  {appt.roomId?.replace("_", " ")}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs text-slate-800 truncate">
                  {appt.patientId?.name || "Paciente"}
                </p>
                <p className="text-[9px] text-slate-400 truncate">{appt.treatmentName}</p>
              </div>
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  appt.status === "CONFIRMED"
                    ? "bg-emerald-400"
                    : appt.status === "IN_PROGRESS"
                      ? "bg-blue-400 animate-pulse"
                      : "bg-amber-300"
                }`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityPanel({ priorityList }) {
  return (
    <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full" />
          <h3 className="text-[9px] font-black uppercase tracking-widest text-amber-500">
            Lista de Prioridad
          </h3>
        </div>
        {priorityList.length > 0 && (
          <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
            {priorityList.length}
          </span>
        )}
      </div>

      {priorityList.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Lista vacía</p>
      ) : (
        <div className="space-y-2">
          {priorityList.map((entry) => (
            <div key={entry._id} className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-2xl">
              <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-xs font-black text-amber-700 shrink-0 uppercase">
                {(entry.patientId?.name || "?").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs text-slate-800 truncate">
                  {entry.patientId?.name || "Paciente"}
                </p>
                <p className="text-[9px] text-slate-400">
                  {entry.desiredDate ? formatDesiredDate(entry.desiredDate) : "Fecha flexible"}
                </p>
              </div>
              <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-lg shrink-0">
                ESPERA
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryPanel({ daySummary }) {
  return (
    <div className="bg-slate-900 rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-teal-400 rounded-full" />
        <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          Resumen del Día
        </h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400">Total citas</span>
          <span className="text-3xl font-black text-white leading-none">
            {daySummary?.total ?? "—"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400">Confirmadas</span>
          <span className="text-2xl font-black text-teal-400 leading-none">
            {daySummary?.confirmed ?? "—"}
          </span>
        </div>
        <div className="border-t border-slate-700 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">Ingresos del día</span>
            <span className="text-lg font-black text-emerald-400 leading-none">
              ${(daySummary?.revenue ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SidePanels({
  waitlist = [],
  daySummary = null,
  upcomingSurgeries = [],
  mobileOpen = false,
  onClose = () => {},
}) {
  const priorityList = waitlist.filter((w) => w.status === "WAITING");

  return (
    <>
      {/* DESKTOP: sidebar fijo a la derecha */}
      <div className="hidden md:flex w-72 xl:w-80 shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto flex-col gap-4 p-4">
        <SurgeryPanel upcomingSurgeries={upcomingSurgeries} />
        <PriorityPanel priorityList={priorityList} />
        <SummaryPanel daySummary={daySummary} />
      </div>

      {/* MÓVIL: backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/40 z-9998 transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* MÓVIL: drawer desde la derecha */}
      <div
        className={`md:hidden fixed top-0 right-0 z-9999 h-[calc(100dvh-80px)] w-[85vw] max-w-xs bg-slate-50 overflow-y-auto flex flex-col gap-4 p-4 shadow-2xl transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Panel</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        <SurgeryPanel upcomingSurgeries={upcomingSurgeries} />
        <PriorityPanel priorityList={priorityList} />
        <SummaryPanel daySummary={daySummary} />
      </div>
    </>
  );
}
