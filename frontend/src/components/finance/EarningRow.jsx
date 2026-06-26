"use client";
import { useState } from "react";
import { CheckCircle, Clock } from "@phosphor-icons/react";
import { formatMXN } from "@/lib/formatCurrency";

export default function EarningRow({
  item,
  defaultCommissionValue = 0,
  defaultCommissionType = "PERCENTAGE",
  onSave,
}) {
  const recorded = !!item.earning;
  const initialAmount = recorded ? item.earning.earnedAmount : item.finalAmount || 0;
  const initialCommission = recorded
    ? (item.earning.commissionValue ?? defaultCommissionValue)
    : defaultCommissionValue;
  const initialType = recorded
    ? (item.earning.commissionType ?? defaultCommissionType)
    : defaultCommissionType;

  const [amount, setAmount] = useState(String(initialAmount));
  const [commission, setCommission] = useState(String(initialCommission));
  const [commissionType, setCommissionType] = useState(initialType);
  const [saving, setSaving] = useState(false);

  const dateLabel = new Date(item.appointmentDate).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.appointmentId, Number(amount), Number(commission), commissionType);
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    Number(amount) !== Number(initialAmount) ||
    Number(commission) !== Number(initialCommission) ||
    commissionType !== initialType;

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col md:flex-row md:items-center gap-4">
      {/* Info de la cita */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-black text-slate-800 truncate">{item.patientName}</p>
          {recorded ? (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
              <CheckCircle size={14} weight="fill" /> Registrado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-amber-500">
              <Clock size={14} weight="fill" /> Pendiente
            </span>
          )}
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">
          {dateLabel} · {item.treatmentName}
        </p>
      </div>

      {/* Comisión / neto (si ya hay registro) */}
      {recorded && (
        <div className="flex gap-6 shrink-0">
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Comisión
            </p>
            <p className="text-sm font-black text-rose-600">
              {formatMXN(item.earning.commissionAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Neto
            </p>
            <p className="text-sm font-black text-emerald-600">
              {formatMXN(
                (item.earning.earnedAmount || 0) - (item.earning.commissionAmount || 0),
              )}
            </p>
          </div>
        </div>
      )}

      {/* Captura: toggle tipo + input comisión + input monto + botón */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        {/* Toggle % / $ */}
        <div className="flex rounded-2xl overflow-hidden border border-slate-100 shrink-0">
          {["PERCENTAGE", "FIXED"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setCommissionType(t)}
              className={`px-3 py-3 text-[11px] font-black transition-colors ${
                commissionType === t
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-400 hover:text-slate-700"
              }`}
            >
              {t === "PERCENTAGE" ? "%" : "$"}
            </button>
          ))}
        </div>

        {/* Input comisión */}
        <div className="relative">
          <input
            type="number"
            min="0"
            max={commissionType === "PERCENTAGE" ? 100 : undefined}
            step="0.1"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full md:w-20 pl-3 pr-7 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-slate-900 font-bold text-sm text-slate-800"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
            {commissionType === "PERCENTAGE" ? "%" : "$"}
          </span>
        </div>

        {/* Input monto ganado */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
            $
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full md:w-32 pl-7 pr-3 py-3 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-slate-900 font-bold text-sm text-slate-800"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving || (recorded && !dirty)}
          className="w-full md:w-auto px-5 py-3 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "..." : recorded ? "Actualizar" : "Confirmar"}
        </button>
      </div>
    </div>
  );
}
