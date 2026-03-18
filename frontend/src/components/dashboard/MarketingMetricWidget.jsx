"use client";

import { Tag } from "@phosphor-icons/react";

export default function MarketingMetricWidget({ stats }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 bg-purple-500 rounded-full" />
        <h3 className="text-[9px] font-black uppercase tracking-widest text-purple-500">
          Marketing
        </h3>
      </div>

      {!stats ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-3">
            <Tag size={24} weight="bold" className="text-purple-300" />
          </div>
          <p className="text-xs font-bold text-slate-400">Sin datos disponibles</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Conversión */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Tasa de Conversión
              </p>
              <p className="text-[9px] text-slate-400">Cupones canjeados</p>
            </div>
            <p className="text-2xl font-black text-purple-600 leading-none">
              {Math.round(stats.conversionRate || 0)}%
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Referidos */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Referidos
              </p>
              <p className="text-[9px] text-slate-400">Total acumulado</p>
            </div>
            <p className="text-2xl font-black text-teal-600 leading-none">
              {stats.totalReferrals || 0}
            </p>
          </div>

          <div className="border-t border-slate-100" />

          {/* Ahorro */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                Ahorro Otorgado
              </p>
              <p className="text-[9px] text-slate-400">Descuentos aplicados</p>
            </div>
            <p className="text-lg font-black text-emerald-500 leading-none">
              ${(stats.totalSavings || 0).toLocaleString("es-MX")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
