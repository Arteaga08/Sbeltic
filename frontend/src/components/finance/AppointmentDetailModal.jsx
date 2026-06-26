"use client";

import {
  X,
  User,
  Calendar,
  Clock,
  Door,
  CurrencyDollar,
  Tag,
  Note,
  Phone,
} from "@phosphor-icons/react";
import { formatMXN } from "@/lib/formatCurrency";

const ROOM_LABELS = {
  CABINA_1: "Cabina 1",
  CABINA_2: "Cabina 2",
  CABINA_3: "Cabina 3",
  SPA: "Spa",
  CONSULTORIO: "Consultorio",
  QUIROFANO: "Quirófano",
};

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "numeric",
    hour12: true,
  });
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-slate-400">
        <Icon size={15} weight="bold" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="text-sm font-bold text-slate-800 capitalize">{value}</p>
      </div>
    </div>
  );
}

export default function AppointmentDetailModal({ appt, onClose }) {
  if (!appt) return null;

  const hasDiscount = appt.discountApplied > 0;
  const hasFinancialDetail = appt.originalQuote > 0 || hasDiscount;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-6 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
              Detalle de cita
            </p>
            <p className="font-black text-slate-900 text-lg leading-tight truncate">
              {appt.patientId?.name || "Paciente"}
            </p>
            {appt.patientId?.phone && (
              <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-bold">
                <Phone size={11} weight="bold" />
                <span>{appt.patientId.phone}</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X size={16} weight="bold" className="text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Atendido por */}
          <Row
            icon={User}
            label="Atendido por"
            value={appt.doctorId?.name || "Sin asignar"}
          />

          {/* Fecha */}
          <Row
            icon={Calendar}
            label="Fecha"
            value={formatFullDate(appt.appointmentDate)}
          />

          {/* Hora */}
          <Row
            icon={Clock}
            label="Hora"
            value={`${formatTime(appt.appointmentDate)}${appt.duration ? ` · ${appt.duration} min` : ""}`}
          />

          {/* Cabina */}
          {appt.roomId && (
            <Row
              icon={Door}
              label="Cabina / Área"
              value={ROOM_LABELS[appt.roomId] || appt.roomId}
            />
          )}

          {/* Tratamiento */}
          <Row
            icon={Tag}
            label="Tratamiento"
            value={
              appt.treatmentCategory
                ? `${appt.treatmentName} · ${appt.treatmentCategory}`
                : (appt.treatmentName || "—")
            }
          />

          {/* Desglose financiero */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <CurrencyDollar size={14} weight="bold" className="text-slate-400" />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                Desglose financiero
              </p>
            </div>

            {hasFinancialDetail && (
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>Cotizado</span>
                <span>{formatMXN(appt.originalQuote)}</span>
              </div>
            )}

            {hasDiscount && (
              <div className="flex justify-between text-[11px] font-bold text-rose-500">
                <span>Descuento</span>
                <span>−{formatMXN(appt.discountApplied)}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-600">
                Total pagado
              </span>
              <span className="text-xl font-black text-emerald-600">
                {formatMXN(appt.finalAmount)}
              </span>
            </div>
          </div>

          {/* Notas */}
          {appt.notes && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 text-slate-400">
                <Note size={15} weight="bold" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Notas
                </p>
                <p className="text-sm text-slate-600 leading-relaxed">{appt.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
