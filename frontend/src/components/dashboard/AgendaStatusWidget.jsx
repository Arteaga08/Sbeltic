"use client";

import { CalendarCheck, CheckCircle, Warning } from "@phosphor-icons/react";

export default function AgendaStatusWidget({ total, confirmed, pending, noShow }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2 h-2 bg-teal-500 rounded-full" />
        <h3 className="text-[9px] font-black uppercase tracking-widest text-teal-600">
          Estado de la Agenda
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Total */}
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 bg-teal-50 rounded-2xl flex items-center justify-center">
            <CalendarCheck size={20} weight="bold" className="text-teal-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 leading-none">{total}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-1">
            Totales
          </p>
        </div>

        {/* Confirmadas */}
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <CheckCircle size={20} weight="bold" className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 leading-none">{confirmed}</p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-1">
            Confirmadas
          </p>
        </div>

        {/* No-Show */}
        <div className="text-center">
          <div
            className={`w-10 h-10 mx-auto mb-2 rounded-2xl flex items-center justify-center ${
              noShow > 0 ? "bg-rose-50" : "bg-slate-50"
            }`}
          >
            <Warning
              size={20}
              weight="bold"
              className={noShow > 0 ? "text-rose-500" : "text-slate-400"}
            />
          </div>
          <p
            className={`text-2xl font-black leading-none ${
              noShow > 0 ? "text-rose-600" : "text-slate-400"
            }`}
          >
            {noShow}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 mt-1">
            No-Show
          </p>
        </div>
      </div>

      {/* Pendientes */}
      {pending > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 py-2 bg-amber-50 rounded-2xl">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-wide text-amber-600">
            {pending} pendiente{pending !== 1 ? "s" : ""} por confirmar
          </p>
        </div>
      )}
    </div>
  );
}
