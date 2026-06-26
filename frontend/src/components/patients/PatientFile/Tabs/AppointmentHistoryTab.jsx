"use client";
import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, UserCircle, Tag, Clock } from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { formatMXN } from "@/lib/formatCurrency";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_LABEL = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
};

const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-600",
  NO_SHOW: "bg-slate-100 text-slate-500",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <div className="animate-pulse flex flex-col gap-2 p-4 border border-slate-100 rounded-2xl">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-slate-100 rounded-lg w-36" />
        <div className="h-5 bg-slate-100 rounded-full w-20" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-48" />
      <div className="h-3 bg-slate-100 rounded w-32" />
    </div>
  );
}

export default function AppointmentHistoryTab({ patient }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    if (!patient?._id) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/patients/${patient._id}/appointments`);
      const data = await res.json();
      if (data.success) setAppointments(Array.isArray(data.data) ? data.data : []);
    } catch {
      toast.error("Error al cargar el historial de visitas");
    } finally {
      setLoading(false);
    }
  }, [patient?._id]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const totalCobrado = appointments
    .filter((a) => a.status === "COMPLETED")
    .reduce((s, a) => s + (a.finalAmount || 0), 0);

  const ultimaVisita = appointments.find((a) => a.status === "COMPLETED");

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            Total visitas
          </span>
          <span className="text-2xl font-black text-slate-800">
            {loading ? "—" : appointments.length}
          </span>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
            Total cobrado
          </span>
          <span className="text-2xl font-black text-emerald-700">
            {loading ? "—" : formatMXN(totalCobrado)}
          </span>
          <span className="text-[8px] text-slate-400 font-semibold">Solo citas completadas</span>
        </div>
        <div className="bg-indigo-50 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
            Última visita
          </span>
          <span className="text-sm font-black text-indigo-700 leading-tight">
            {loading ? "—" : ultimaVisita ? formatDateShort(ultimaVisita.appointmentDate) : "Sin visitas"}
          </span>
        </div>
      </div>

      {/* Lista */}
      <div>
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
          Historial de citas
        </h3>

        {loading ? (
          <div className="space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300">
            <CalendarCheck size={40} weight="duotone" />
            <p className="text-[11px] font-black uppercase tracking-widest">Sin citas registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt._id}
                className="border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition-all"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  {/* Izquierda: fecha + tratamiento */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock size={12} weight="bold" />
                      <span className="text-[10px] font-bold">{formatDate(apt.appointmentDate)}</span>
                    </div>

                    <p className="text-sm font-black text-slate-800 leading-snug capitalize">
                      {apt.treatmentName || "Tratamiento no especificado"}
                    </p>

                    {apt.treatmentCategory && (
                      <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full w-fit">
                        <Tag size={8} weight="bold" />
                        {apt.treatmentCategory}
                      </span>
                    )}

                    {apt.doctorId?.name && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <UserCircle size={12} weight="bold" />
                        <span className="text-[10px] font-semibold">{apt.doctorId.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Derecha: status + monto */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_STYLES[apt.status] || "bg-slate-100 text-slate-500"}`}
                    >
                      {STATUS_LABEL[apt.status] || apt.status}
                    </span>

                    {apt.finalAmount > 0 && (
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-slate-800">
                          {formatMXN(apt.finalAmount)}
                        </span>
                        {apt.discountApplied > 0 && (
                          <span className="text-[9px] text-slate-400 line-through">
                            {formatMXN(apt.originalQuote)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
