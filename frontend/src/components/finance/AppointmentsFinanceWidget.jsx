"use client";

import { useState, useEffect, useMemo } from "react";
import { CurrencyDollar, Phone } from "@phosphor-icons/react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { formatMXN } from "@/lib/formatCurrency";
import AppointmentDetailModal from "./AppointmentDetailModal";

const API = process.env.NEXT_PUBLIC_API_URL;

// Rangos de periodo (todos ≤ 30 días, caben en el tope del endpoint de citas)
const PERIODS = [
  { id: "today", label: "Hoy", days: 1 },
  { id: "week", label: "Esta semana", days: 7 },
  { id: "month", label: "Este mes", days: 30 },
];

function getRangeStart(periodId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (periodId === "week") {
    // Lunes de la semana actual
    const day = start.getDay();
    start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  } else if (periodId === "month") {
    start.setDate(1);
  }
  return start;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Vista global de finanzas por cita (cobrado): lista de citas COMPLETED con
 * paciente, datos y montos. Filtro de periodo propio (Hoy / Semana / Mes).
 */
export default function AppointmentsFinanceWidget() {
  const [period, setPeriod] = useState("week");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppt, setSelectedAppt] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchFinance() {
      setLoading(true);
      try {
        const start = getRangeStart(period);
        const days = PERIODS.find((p) => p.id === period)?.days ?? 7;
        const res = await fetchWithAuth(
          `${API}/appointments?date=${start.toISOString()}&days=${days}&status=COMPLETED`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setAppointments(data.data || []);
      } catch (err) {
        if (err.name !== "AbortError") setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchFinance();
    return () => controller.abort();
  }, [period]);

  const totals = useMemo(
    () => ({
      revenue: appointments.reduce((s, a) => s + (a.finalAmount || 0), 0),
      count: appointments.length,
    }),
    [appointments],
  );

  return (
    <div className="space-y-6">
      {/* Filtro de periodo */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wide transition-colors ${
              period === p.id
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Total del periodo */}
      <div className="bg-slate-900 text-white rounded-4xl p-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Total cobrado del periodo
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5">
            {totals.count} {totals.count === 1 ? "cita" : "citas"}
          </p>
        </div>
        <p className="text-3xl font-black text-emerald-400">
          {formatMXN(totals.revenue)}
        </p>
      </div>

      {/* Lista por cita */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-3xl" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-4xl p-12 text-center">
          <CurrencyDollar size={28} weight="bold" className="text-slate-300 mx-auto mb-2" />
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
            Sin citas cobradas en este periodo
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div
              key={appt._id}
              onClick={() => setSelectedAppt(appt)}
              className="bg-white border border-slate-100 rounded-3xl p-5 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-black text-slate-800 truncate">
                    {appt.patientId?.name || "Paciente"}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Phone size={11} weight="bold" />
                    <span className="truncate">
                      {appt.patientId?.phone || "Sin teléfono"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {appt.treatmentName || "Tratamiento"} · {formatDate(appt.appointmentDate)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-emerald-600 leading-none">
                    {formatMXN(appt.finalAmount)}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    Pagó
                  </p>
                </div>
              </div>

              {(appt.originalQuote > 0 || appt.discountApplied > 0) && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-[10px] font-bold">
                  <span className="text-slate-400">
                    Cotizado {formatMXN(appt.originalQuote)}
                  </span>
                  {appt.discountApplied > 0 && (
                    <span className="text-rose-500">
                      Desc. −{formatMXN(appt.discountApplied)}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AppointmentDetailModal
        appt={selectedAppt}
        onClose={() => setSelectedAppt(null)}
      />
    </div>
  );
}
