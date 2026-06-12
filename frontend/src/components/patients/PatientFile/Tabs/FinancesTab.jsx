"use client";
import { useState, useEffect, useCallback } from "react";
import { Plus, Trash, CurrencyDollar, Receipt } from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { CONNECTION_ERROR } from "@/lib/apiError";
import FormError from "@/components/ui/FormError";

const API = process.env.NEXT_PUBLIC_API_URL;

const STATUS_LABEL = {
  PENDING: "Pendiente",
  PARTIAL: "Parcial",
  PAID: "Pagada",
};

const STATUS_STYLES = {
  PENDING: "bg-rose-100 text-rose-600",
  PARTIAL: "bg-amber-100 text-amber-600",
  PAID: "bg-emerald-100 text-emerald-600",
};

function formatMXN(n) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0 }).format(n ?? 0);
}

function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
      <div
        className={`h-1.5 rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-rose-300"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function FinancesTab({ patient, userRole }) {
  const [deudas, setDeudas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDeuda, setShowNewDeuda] = useState(false);
  const [newDeuda, setNewDeuda] = useState({ concept: "", totalAmount: "" });
  const [savingDeuda, setSavingDeuda] = useState(false);
  const [deudaError, setDeudaError] = useState("");
  const [openPaymentId, setOpenPaymentId] = useState(null);
  const [newPayment, setNewPayment] = useState({ amount: "", note: "" });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const fetchDeudas = useCallback(async () => {
    if (!patient?._id) return;
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API}/patients/${patient._id}/deudas`);
      const data = await res.json();
      if (data.status === "success") setDeudas(Array.isArray(data.data) ? data.data : []);
    } catch {
      toast.error("Error al cargar finanzas");
    } finally {
      setLoading(false);
    }
  }, [patient?._id]);

  useEffect(() => { fetchDeudas(); }, [fetchDeudas]);

  const totalDeuda = deudas.reduce((s, d) => s + (d.totalAmount || 0), 0);
  const totalPagado = deudas.reduce((s, d) => s + (d.paidAmount || 0), 0);
  const totalBalance = deudas.reduce((s, d) => s + (d.balance || 0), 0);

  async function handleCreateDeuda() {
    setDeudaError("");
    if (!newDeuda.concept.trim() || !newDeuda.totalAmount) {
      return setDeudaError("Escribe el concepto y el monto de la deuda.");
    }
    setSavingDeuda(true);
    try {
      const res = await fetchWithAuth(`${API}/patients/${patient._id}/deudas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: newDeuda.concept.trim(), totalAmount: Number(newDeuda.totalAmount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeudaError(data.message || "No se pudo registrar la deuda.");
        return;
      }
      setDeudas((prev) => [data.data, ...prev]);
      setNewDeuda({ concept: "", totalAmount: "" });
      setShowNewDeuda(false);
      toast.success("Deuda registrada");
    } catch (err) {
      setDeudaError(CONNECTION_ERROR);
    } finally {
      setSavingDeuda(false);
    }
  }

  async function handleAddPayment(deudaId) {
    setPaymentError("");
    if (!newPayment.amount || Number(newPayment.amount) <= 0) {
      return setPaymentError("El monto del abono debe ser mayor a 0.");
    }
    setSavingPayment(true);
    try {
      const res = await fetchWithAuth(`${API}/patients/${patient._id}/deudas/${deudaId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(newPayment.amount), note: newPayment.note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.message || "No se pudo registrar el abono.");
        return;
      }
      setDeudas((prev) => prev.map((d) => (d._id === deudaId ? data.data : d)));
      setNewPayment({ amount: "", note: "" });
      setOpenPaymentId(null);
      toast.success("Abono registrado");
    } catch (err) {
      setPaymentError(CONNECTION_ERROR);
    } finally {
      setSavingPayment(false);
    }
  }

  async function handleDeleteDeuda(deudaId) {
    if (!confirm("¿Eliminar esta deuda y todos sus abonos?")) return;
    try {
      const res = await fetchWithAuth(`${API}/patients/${patient._id}/deudas/${deudaId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setDeudas((prev) => prev.filter((d) => d._id !== deudaId));
      toast.success("Deuda eliminada");
    } catch {
      toast.error("No se pudo eliminar la deuda");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400 text-sm font-bold">
        Cargando finanzas...
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-rose-50 rounded-2xl p-4 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1">Total deuda</p>
          <p className="text-lg font-black text-rose-600">{formatMXN(totalDeuda)}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Abonado</p>
          <p className="text-lg font-black text-amber-600">{formatMXN(totalPagado)}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 text-center">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">Saldo</p>
          <p className="text-lg font-black text-emerald-600">{formatMXN(totalBalance)}</p>
        </div>
      </div>

      {/* Nueva deuda */}
      {!showNewDeuda ? (
        <button
          onClick={() => { setShowNewDeuda(true); setDeudaError(""); }}
          className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black uppercase text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} weight="bold" /> Nueva deuda / facilidad de pago
        </button>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nueva deuda</p>
          <input
            type="text"
            placeholder="Concepto (ej. Rinoplastia - facilidad)"
            value={newDeuda.concept}
            onChange={(e) => setNewDeuda((p) => ({ ...p, concept: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400"
          />
          <input
            type="number"
            placeholder="Monto total ($)"
            min="0"
            value={newDeuda.totalAmount}
            onChange={(e) => setNewDeuda((p) => ({ ...p, totalAmount: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-400"
          />
          <FormError message={deudaError} />
          <div className="flex gap-2">
            <button
              onClick={handleCreateDeuda}
              disabled={savingDeuda}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {savingDeuda ? "Guardando..." : "Registrar"}
            </button>
            <button
              onClick={() => { setShowNewDeuda(false); setNewDeuda({ concept: "", totalAmount: "" }); setDeudaError(""); }}
              className="px-4 py-2.5 bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de deudas */}
      {deudas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-300 gap-3">
          <CurrencyDollar size={40} weight="thin" />
          <p className="text-sm font-bold">Sin deudas registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deudas.map((deuda) => (
            <div key={deuda._id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              {/* Header deuda */}
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-800 text-sm truncate">{deuda.concept}</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${STATUS_STYLES[deuda.status]}`}>
                      {STATUS_LABEL[deuda.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <p className="text-xs text-slate-500">Total: <span className="font-black text-slate-700">{formatMXN(deuda.totalAmount)}</span></p>
                    <p className="text-xs text-slate-500">Abonado: <span className="font-black text-amber-600">{formatMXN(deuda.paidAmount)}</span></p>
                    <p className="text-xs text-slate-500">Saldo: <span className="font-black text-rose-600">{formatMXN(deuda.balance)}</span></p>
                  </div>
                  <ProgressBar paid={deuda.paidAmount} total={deuda.totalAmount} />
                </div>
                {userRole === "ADMIN" && (
                  <button
                    onClick={() => handleDeleteDeuda(deuda._id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                )}
              </div>

              {/* Abonos */}
              {(deuda.payments?.length > 0) && (
                <div className="border-t border-slate-50 px-4 pb-3 pt-2 space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2">Abonos</p>
                  {(deuda.payments ?? []).map((pmt) => (
                    <div key={pmt._id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Receipt size={13} weight="bold" className="text-slate-400 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-emerald-600">{formatMXN(pmt.amount)}</p>
                          {pmt.note && <p className="text-[10px] text-slate-400">{pmt.note}</p>}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 shrink-0">
                        {new Date(pmt.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario nuevo abono */}
              {deuda.status !== "PAID" && (
                <div className="border-t border-slate-50 px-4 pb-4 pt-3">
                  {openPaymentId === deuda._id ? (
                    <div className="space-y-2">
                      <input
                        type="number"
                        placeholder="Monto del abono ($)"
                        min="0"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment((p) => ({ ...p, amount: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-emerald-400"
                      />
                      <input
                        type="text"
                        placeholder="Nota (opcional)"
                        value={newPayment.note}
                        onChange={(e) => setNewPayment((p) => ({ ...p, note: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-emerald-400"
                      />
                      <FormError message={paymentError} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddPayment(deuda._id)}
                          disabled={savingPayment}
                          className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-emerald-600 transition-colors disabled:opacity-50"
                        >
                          {savingPayment ? "Guardando..." : "Registrar abono"}
                        </button>
                        <button
                          onClick={() => { setOpenPaymentId(null); setNewPayment({ amount: "", note: "" }); setPaymentError(""); }}
                          className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setOpenPaymentId(deuda._id); setNewPayment({ amount: "", note: "" }); setPaymentError(""); }}
                      className="w-full py-2 border-2 border-dashed border-emerald-200 rounded-xl text-xs font-black uppercase text-emerald-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} weight="bold" /> Registrar abono
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
