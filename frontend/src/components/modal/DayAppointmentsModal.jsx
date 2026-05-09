"use client";

import { useState, useMemo, useEffect } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useTreatmentCategories } from "@/context/TreatmentCategoriesContext";
import { getCategoryById, getCategoryFromTreatment } from "@/lib/treatmentCategories";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const STATUS_CONFIG = {
  PENDING:     { label: "Pendiente",   bg: "bg-amber-100",   text: "text-amber-700" },
  CONFIRMED:   { label: "Confirmada",  bg: "bg-emerald-100", text: "text-emerald-700" },
  IN_PROGRESS: { label: "En curso",    bg: "bg-blue-100",    text: "text-blue-700",  pulse: true },
  COMPLETED:   { label: "Completada",  bg: "bg-teal-100",    text: "text-teal-700" },
  NO_SHOW:     { label: "No asistió",  bg: "bg-slate-100",   text: "text-slate-500" },
};

function AppointmentRow({ appt, categories, onClick }) {
  const catId =
    appt.treatmentCategory ||
    getCategoryFromTreatment(appt.treatmentName, categories);
  const cat = getCategoryById(catId, categories);
  const s = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.PENDING;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:bg-sky-50 hover:border-sky-100 active:scale-[0.99] transition-all cursor-pointer"
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0 text-white uppercase ${cat?.gridBg ?? "bg-slate-400"}`}
      >
        {(appt.patientId?.name || "?").charAt(0)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-black text-sm text-slate-800 truncate">
          {appt.patientId?.name || "Paciente"}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          {formatTime(appt.appointmentDate)}
          {appt.duration ? ` · ${appt.duration} min` : ""}
          {appt.treatmentName ? ` · ${appt.treatmentName}` : ""}
        </p>
      </div>

      {/* Status badge */}
      <span
        className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${s.bg} ${s.text} ${s.pulse ? "animate-pulse" : ""}`}
      >
        {s.label}
      </span>

      {/* Chevron */}
      <svg
        width={12}
        height={12}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-300 shrink-0"
      >
        <path d="M6 3l5 5-5 5" />
      </svg>
    </button>
  );
}

export default function DayAppointmentsModal({
  isOpen,
  onClose,
  todayAppointments = [],
  onAppointmentClick,
}) {
  useScrollLock(isOpen);

  const categories = useTreatmentCategories();
  const [activeTab, setActiveTab] = useState("todas");

  useEffect(() => {
    if (isOpen) setActiveTab("todas");
  }, [isOpen]);

  const tabs = useMemo(() => {
    const unique = [
      ...new Set(
        todayAppointments.map(
          (a) =>
            a.treatmentCategory ||
            getCategoryFromTreatment(a.treatmentName, categories),
        ),
      ),
    ].filter(Boolean);
    return ["todas", ...unique];
  }, [todayAppointments, categories]);

  const visibleAppts = useMemo(() => {
    if (activeTab === "todas") return todayAppointments;
    return todayAppointments.filter(
      (a) =>
        (a.treatmentCategory ||
          getCategoryFromTreatment(a.treatmentName, categories)) === activeTab,
    );
  }, [activeTab, todayAppointments, categories]);

  if (!isOpen) return null;

  const todayLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

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
              <div className="w-2 h-2 bg-sky-500 rounded-full" />
              <h2 className="text-base font-black text-slate-800">Citas del Día</h2>
            </div>
            <p className="text-xs text-slate-400 font-medium pl-4 capitalize">
              {todayLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">
              {todayAppointments.length} cita{todayAppointments.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
            >
              <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M3 3l10 10M13 3L3 13" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab bar — siempre visible si hay categorías */}
        {tabs.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto px-6 py-3 shrink-0 no-scrollbar border-b border-slate-50">
            {tabs.map((tab) => {
              const cat = tab === "todas" ? null : getCategoryById(tab, categories);
              const isActive = activeTab === tab;
              const count =
                tab === "todas"
                  ? todayAppointments.length
                  : todayAppointments.filter(
                      (a) =>
                        (a.treatmentCategory ||
                          getCategoryFromTreatment(a.treatmentName, categories)) === tab,
                    ).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[10px] font-black px-3 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all ${
                    isActive
                      ? tab === "todas"
                        ? "bg-sky-500 text-white shadow-sm"
                        : `${cat?.colorClass ?? "bg-slate-600 text-white"} shadow-sm`
                      : tab === "todas"
                      ? "bg-sky-50 text-sky-500 hover:bg-sky-100"
                      : `${cat?.unselectedClass ?? "bg-slate-100 text-slate-500"} hover:opacity-80`
                  }`}
                >
                  {tab === "todas" ? "Todas" : (cat?.label ?? tab)} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
          {todayAppointments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-3xl mb-3">📅</p>
              <p className="text-slate-500 text-sm font-bold">Sin citas para hoy</p>
              <p className="text-slate-300 text-xs mt-1">Disfruta el día tranquilo</p>
            </div>
          ) : visibleAppts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-slate-400 text-sm">Sin citas en esta categoría hoy</p>
            </div>
          ) : (
            visibleAppts.map((appt) => (
              <AppointmentRow
                key={appt._id}
                appt={appt}
                categories={categories}
                onClick={() => onAppointmentClick?.(appt)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
