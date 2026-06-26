"use client";
import { formatMXN } from "@/lib/formatCurrency";

/**
 * Tarjetas de resumen del estado de cuenta de un colaborador.
 * @param {object} summary - { totalEarned, totalCommission, netForCollaborator, patientsCount, pendingCount }
 */
export default function FinanceSummaryCards({ summary }) {
  const cards = [
    {
      label: "Total ganado",
      value: formatMXN(summary.totalEarned),
      accent: "text-slate-900",
    },
    {
      label: "Comisión del admin",
      value: formatMXN(summary.totalCommission),
      accent: "text-rose-600",
    },
    {
      label: "Neto colaborador",
      value: formatMXN(summary.netForCollaborator),
      accent: "text-emerald-600",
    },
    {
      label: "Pacientes",
      value: String(summary.patientsCount ?? 0),
      accent: "text-indigo-600",
      hint:
        summary.pendingCount > 0
          ? `${summary.pendingCount} por registrar`
          : "Todo registrado",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-slate-100 rounded-4xl p-5 shadow-sm"
        >
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {card.label}
          </p>
          <p className={`text-2xl font-black mt-2 ${card.accent}`}>{card.value}</p>
          {card.hint && (
            <p className="text-[10px] font-bold text-slate-400 mt-1">{card.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}
