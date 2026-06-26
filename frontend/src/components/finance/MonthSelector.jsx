"use client";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function MonthSelector({ month, year, onChange }) {
  const goPrev = () => {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  };

  const goNext = () => {
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  };

  return (
    <div className="inline-flex items-center gap-2 bg-white border-2 border-slate-100 rounded-2xl p-1.5">
      <button
        onClick={goPrev}
        aria-label="Mes anterior"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
      >
        <CaretLeft size={18} weight="bold" />
      </button>
      <span className="min-w-[150px] text-center font-black text-slate-800 uppercase tracking-widest text-xs">
        {MONTH_NAMES[month - 1]} {year}
      </span>
      <button
        onClick={goNext}
        aria-label="Mes siguiente"
        className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
      >
        <CaretRight size={18} weight="bold" />
      </button>
    </div>
  );
}
