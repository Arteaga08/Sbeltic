"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CaretRight, ArrowLeft } from "@phosphor-icons/react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { formatMXN } from "@/lib/formatCurrency";
import EarningsStatement from "./EarningsStatement";

const API = process.env.NEXT_PUBLIC_API_URL;

const ROLE_LABEL = {
  DOCTOR: "Colaborador",
  PHYSIOTHERAPIST: "Fisioterapia",
};

/**
 * Panel del admin: totales del mes por colaborador con opción de abrir
 * el estado de cuenta detallado de cada uno.
 */
export default function AdminFinanceDashboard({ month, year }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { collaboratorId, name }

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month, year });
      const res = await fetchWithAuth(`${API}/finance/admin-summary?${params}`);
      const result = await res.json();
      setRows(result.data?.collaborators || []);
    } catch (err) {
      toast.error("No se pudo cargar el resumen de finanzas");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Vista de detalle de un colaborador
  if (selected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} weight="bold" /> Volver al resumen
        </button>
        <h3 className="text-2xl font-extrabold italic uppercase text-slate-900">
          {selected.name}
        </h3>
        <EarningsStatement
          month={month}
          year={year}
          collaboratorId={selected.collaboratorId}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-100 rounded-3xl" />
        ))}
      </div>
    );
  }

  const totalCommission = rows.reduce((s, r) => s + (r.totalCommission || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white rounded-4xl p-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Comisión total del mes
        </p>
        <p className="text-3xl font-black mt-2">{formatMXN(totalCommission)}</p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <button
            key={row.collaboratorId}
            onClick={() =>
              setSelected({ collaboratorId: row.collaboratorId, name: row.name })
            }
            className="w-full bg-white border border-slate-100 rounded-3xl p-5 flex items-center gap-4 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 shrink-0 flex items-center justify-center font-black text-lg rounded-2xl bg-slate-100 text-slate-600">
              {row.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-800 truncate">{row.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {ROLE_LABEL[row.role] || row.role} · {row.patientsCount} pacientes
              </p>
              {row.pendingCount > 0 && (
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mt-0.5">
                  {row.pendingCount} por registrar
                </p>
              )}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Ganado
              </p>
              <p className="text-sm font-black text-slate-800">
                {formatMXN(row.totalEarned)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Comisión
              </p>
              <p className="text-sm font-black text-rose-600">
                {formatMXN(row.totalCommission)}
              </p>
            </div>
            <CaretRight size={18} weight="bold" className="text-slate-300 shrink-0" />
          </button>
        ))}
        {rows.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-4xl p-12 text-center">
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
              No hay colaboradores registrados
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
