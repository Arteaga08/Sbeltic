"use client";

import { useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import SurgeriesModal from "@/components/modal/SurgeriesModal";
import PrioritiesModal from "@/components/modal/PrioritiesModal";
import WaitlistModal from "@/components/modal/WaitlistModal";
import WeeklySummaryModal from "@/components/modal/WeeklySummaryModal";
import DayAppointmentsModal from "@/components/modal/DayAppointmentsModal";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDayShort(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (isSameDay(d, today)) return "Hoy";
  if (isSameDay(d, tomorrow)) return "Mañana";
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" });
}

const STATUS_LABEL = {
  PENDING: { label: "Pendiente", bg: "bg-amber-100", text: "text-amber-700" },
  CONFIRMED: { label: "Confirmada", bg: "bg-emerald-100", text: "text-emerald-700" },
  IN_PROGRESS: { label: "En curso", bg: "bg-blue-100 animate-pulse", text: "text-blue-700" },
};

function PanelCard({ onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${className}`}
    >
      {children}
    </button>
  );
}

function StatusDot({ status }) {
  const map = {
    PENDING:     "bg-amber-300",
    CONFIRMED:   "bg-emerald-400",
    IN_PROGRESS: "bg-blue-400 animate-pulse",
    COMPLETED:   "bg-teal-300",
    NO_SHOW:     "bg-gray-300",
  };
  return <div className={`w-2 h-2 rounded-full shrink-0 ${map[status] ?? "bg-slate-200"}`} />;
}

function DayPanel({ todayAppointments, onClick }) {
  const preview = todayAppointments.slice(0, 3);
  const activeCount = todayAppointments.filter(
    (a) => !["COMPLETED", "NO_SHOW"].includes(a.status),
  ).length;

  return (
    <PanelCard onClick={onClick}>
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-sky-500 rounded-full" />
            <h3 className="text-[9px] font-black uppercase tracking-widest text-sky-500">
              Citas del Día
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {activeCount > 0 && (
              <span className="text-[9px] font-black bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">
                {activeCount} activas
              </span>
            )}
            {todayAppointments.length > 0 && (
              <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {todayAppointments.length}
              </span>
            )}
          </div>
        </div>

        {todayAppointments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin citas para hoy</p>
        ) : (
          <div className="space-y-2">
            {preview.map((appt) => (
              <div
                key={appt._id}
                className="flex items-center gap-3 p-2.5 bg-sky-50 rounded-2xl border border-sky-100"
              >
                <div className="w-8 h-8 bg-sky-200 rounded-full flex items-center justify-center text-xs font-black text-sky-700 shrink-0 uppercase">
                  {(appt.patientId?.name || "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs text-slate-800 truncate">
                    {appt.patientId?.name || "Paciente"}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {formatTime(appt.appointmentDate)}
                    {appt.treatmentName ? ` · ${appt.treatmentName}` : ""}
                  </p>
                </div>
                <StatusDot status={appt.status} />
              </div>
            ))}
            {todayAppointments.length > 3 && (
              <p className="text-[9px] text-sky-400 font-bold text-center pt-1">
                +{todayAppointments.length - 3} más
              </p>
            )}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function SurgeryPanel({ upcomingSurgeries, onClick }) {
  return (
    <PanelCard onClick={onClick}>
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-rose-500 rounded-full" />
            <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-500">
              Próximas Cirugías
            </h3>
          </div>
          {upcomingSurgeries.length > 0 && (
            <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
              {upcomingSurgeries.length}
            </span>
          )}
        </div>

        {upcomingSurgeries.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin cirugías programadas</p>
        ) : (
          <div className="space-y-2">
            {upcomingSurgeries.map((appt) => {
              const s = STATUS_LABEL[appt.status] ?? STATUS_LABEL.PENDING;
              return (
                <div key={appt._id} className="flex flex-col gap-1.5 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-rose-600 leading-none">
                        {formatTime(appt.appointmentDate)}
                      </span>
                      <span className="text-[9px] font-bold text-rose-400 uppercase">
                        {formatDayShort(appt.appointmentDate)}
                      </span>
                    </div>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full shrink-0 ${s.bg} ${s.text}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="font-black text-sm text-slate-800 leading-tight">
                    {appt.patientId?.name || "Paciente"}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black text-rose-500 uppercase bg-rose-100 px-1.5 py-0.5 rounded-md">
                      {appt.roomId?.replace(/_/g, " ")}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate">
                      {appt.treatmentName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function PriorityPanel({ priorityAppointments, onClick }) {
  const urgentCount = priorityAppointments.filter((a) => a.isUrgent).length;

  return (
    <PanelCard onClick={onClick}>
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full" />
            <h3 className="text-[9px] font-black uppercase tracking-widest text-amber-500">
              Lista de Prioridad
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {urgentCount > 0 && (
              <span className="text-[9px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                {urgentCount} urg
              </span>
            )}
            {priorityAppointments.length > 0 && (
              <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
                {priorityAppointments.length}
              </span>
            )}
          </div>
        </div>

        {priorityAppointments.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin citas prioritarias</p>
        ) : (
          <div className="space-y-2">
            {priorityAppointments.map((appt) => (
              <div
                key={appt._id}
                className={`flex items-center gap-3 p-2.5 rounded-2xl border ${
                  appt.isUrgent
                    ? "bg-rose-50 border-rose-100"
                    : "bg-amber-50 border-amber-100"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 uppercase ${
                  appt.isUrgent ? "bg-rose-200 text-rose-700" : "bg-amber-200 text-amber-700"
                }`}>
                  {(appt.patientId?.name || "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs text-slate-800 truncate">
                    {appt.patientId?.name || "Paciente"}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {formatDayShort(appt.appointmentDate)} · {formatTime(appt.appointmentDate)}
                  </p>
                </div>
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg shrink-0 ${
                  appt.isUrgent ? "bg-rose-200 text-rose-700" : "bg-amber-200 text-amber-700"
                }`}>
                  {appt.isUrgent ? "URG" : "PRIO"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function WaitlistPanel({ waitlist, onClick }) {
  const pending = waitlist.filter((w) => w.status === "WAITING");
  return (
    <PanelCard onClick={onClick}>
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-violet-400 rounded-full" />
            <h3 className="text-[9px] font-black uppercase tracking-widest text-violet-500">
              Lista de Espera
            </h3>
          </div>
          {pending.length > 0 && (
            <span className="text-[9px] font-black bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin pacientes en espera</p>
        ) : (
          <div className="space-y-2">
            {pending.map((entry) => (
              <div key={entry._id} className="flex items-center gap-3 p-2.5 bg-violet-50 rounded-2xl border border-violet-100">
                <div className="w-8 h-8 bg-violet-200 rounded-full flex items-center justify-center text-xs font-black text-violet-700 shrink-0 uppercase">
                  {(entry.patientId?.name || "?").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-xs text-slate-800 truncate">
                    {entry.patientId?.name || "Paciente"}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    {entry.desiredDate ? formatDayShort(entry.desiredDate) : "Fecha flexible"}
                  </p>
                </div>
                <span className="text-[8px] font-black bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-lg shrink-0">
                  ESPERA
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PanelCard>
  );
}

function SummaryPanel({ weeklySummary, onClick, isAdmin = false }) {
  return (
    <PanelCard onClick={onClick}>
      <div className="bg-slate-900 rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-400 rounded-full" />
          <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Resumen Semanal
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">Total citas</span>
            <span className="text-3xl font-black text-white leading-none">
              {weeklySummary?.total ?? "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">Confirmadas</span>
            <span className="text-2xl font-black text-teal-400 leading-none">
              {weeklySummary?.confirmed ?? "—"}
            </span>
          </div>
          {isAdmin && (
            <div className="border-t border-slate-700 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">Ingresos de la semana</span>
                <span className="text-lg font-black text-emerald-400 leading-none">
                  ${(weeklySummary?.revenue ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelCard>
  );
}

export default function SidePanels({
  priorityAppointments = [],
  waitlist = [],
  weeklySummary = null,
  upcomingSurgeries = [],
  appointments = [],
  todayAppointments = [],
  onAppointmentClick,
  mobileOpen = false,
  onClose = () => {},
  isAdmin = false,
}) {
  useScrollLock(mobileOpen);
  const [openModal, setOpenModal] = useState(null);

  const panels = (
    <>
      <SurgeryPanel upcomingSurgeries={upcomingSurgeries} onClick={() => setOpenModal("surgeries")} />
      <PriorityPanel priorityAppointments={priorityAppointments} onClick={() => setOpenModal("priorities")} />
      <DayPanel todayAppointments={todayAppointments} onClick={() => setOpenModal("day")} />
      <WaitlistPanel waitlist={waitlist} onClick={() => setOpenModal("waitlist")} />
      <SummaryPanel weeklySummary={weeklySummary} onClick={() => setOpenModal("summary")} isAdmin={isAdmin} />
    </>
  );

  return (
    <>
      {/* DESKTOP: sidebar fijo a la derecha */}
      <div className="hidden md:flex w-72 xl:w-80 2xl:w-96 shrink-0 border-l border-slate-200 bg-slate-50 overflow-y-auto flex-col gap-4 p-4">
        {panels}
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
        <div className="flex items-center justify-between pt-1 pb-1">
          <h2 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Panel</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center active:scale-95 transition-transform"
          >
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>
        {panels}
      </div>

      {/* Modales */}
      <SurgeriesModal
        isOpen={openModal === "surgeries"}
        onClose={() => setOpenModal(null)}
        upcomingSurgeries={upcomingSurgeries}
      />
      <PrioritiesModal
        isOpen={openModal === "priorities"}
        onClose={() => setOpenModal(null)}
        priorityAppointments={priorityAppointments}
      />
      <WaitlistModal
        isOpen={openModal === "waitlist"}
        onClose={() => setOpenModal(null)}
        waitlist={waitlist}
      />
      <WeeklySummaryModal
        isOpen={openModal === "summary"}
        onClose={() => setOpenModal(null)}
        weeklySummary={weeklySummary}
        appointments={appointments}
        isAdmin={isAdmin}
      />
      <DayAppointmentsModal
        isOpen={openModal === "day"}
        onClose={() => setOpenModal(null)}
        todayAppointments={todayAppointments}
        onAppointmentClick={(appt) => {
          setOpenModal(null);
          onAppointmentClick?.(appt);
        }}
      />
    </>
  );
}
