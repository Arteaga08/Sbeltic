"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { CONNECTION_ERROR } from "@/lib/apiError";
import FinanceSummaryCards from "./FinanceSummaryCards";
import EarningRow from "./EarningRow";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Estado de cuenta de un colaborador: resumen + lista de citas completadas
 * con captura del monto ganado. Si se pasa collaboratorId, el admin ve a ese
 * colaborador; si no, el backend usa al usuario autenticado.
 */
export default function EarningsStatement({ month, year, collaboratorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStatement = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month, year });
      if (collaboratorId) params.set("collaboratorId", collaboratorId);
      const res = await fetchWithAuth(`${API}/finance/my-statement?${params}`);
      const result = await res.json();
      setData(result.data || null);
    } catch (err) {
      toast.error("No se pudo cargar el estado de cuenta");
    } finally {
      setLoading(false);
    }
  }, [month, year, collaboratorId]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handleSave = async (appointmentId, earnedAmount, commissionValue, commissionType, earningId) => {
    try {
      const url = earningId
        ? `${API}/finance/earnings/${earningId}`
        : `${API}/finance/earnings`;
      const method = earningId ? "PUT" : "POST";
      const body = earningId
        ? { earnedAmount, commissionValue, commissionType }
        : { appointmentId, earnedAmount, commissionValue, commissionType };

      const res = await fetchWithAuth(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success("Ganancia guardada");
        fetchStatement();
      } else {
        const result = await res.json().catch(() => ({}));
        toast.error(result.message || "No se pudo guardar la ganancia");
      }
    } catch (err) {
      toast.error(CONNECTION_ERROR);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-4xl" />
          ))}
        </div>
        <div className="h-20 bg-slate-100 rounded-3xl" />
        <div className="h-20 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <FinanceSummaryCards summary={data.summary} />

      {data.items.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-4xl p-12 text-center">
          <p className="font-black text-slate-400 uppercase tracking-widest text-xs">
            No hay citas completadas en este mes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((item) => (
            <EarningRow
              key={item.appointmentId}
              item={item}
              defaultCommissionValue={data.defaultCommission?.value ?? 0}
              defaultCommissionType={data.defaultCommission?.type ?? "PERCENTAGE"}
              onSave={(appointmentId, earnedAmount, commissionValue, commissionType) =>
                handleSave(appointmentId, earnedAmount, commissionValue, commissionType, item.earning?._id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
