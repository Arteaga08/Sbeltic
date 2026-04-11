"use client";

import {
  CaretLeft,
  CaretRight,
  Plus,
  CaretDownIcon,
} from "@phosphor-icons/react";

const ROOMS = [
  { value: "ALL", label: "Todas las cabinas" },
  { value: "CABINA_1", label: "Cabina 1" },
  { value: "CABINA_2", label: "Cabina 2" },
  { value: "CABINA_3", label: "Cabina 3" },
  { value: "SPA", label: "Spa" },
  { value: "CONSULTORIO", label: "Consultorio" },
  { value: "QUIROFANO", label: "Quirofano" },
];

function getWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d;
}

function formatWeekRange(start) {
  const end = new Date(start);
  end.setDate(start.getDate() + 5);
  const locale = "es-MX";
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = end.getFullYear();
  if (start.getMonth() === end.getMonth()) {
    const month = end.toLocaleDateString(locale, { month: "short" });
    return `${startDay} – ${endDay} ${month} ${year}`;
  }
  const sm = start.toLocaleDateString(locale, { month: "short" });
  const em = end.toLocaleDateString(locale, { month: "short" });
  return `${startDay} ${sm} – ${endDay} ${em} ${year}`;
}

export default function AgendaHeader({
  weekStart,
  onWeekChange,
  filterRoom,
  onFilterRoom,
  staff = [],
  filterDoctor,
  onFilterDoctor,
  onNewAppointment,
}) {
  const goWeek = (delta) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    onWeekChange(d);
  };

  const goThisWeek = () => onWeekChange(getWeekStart(new Date()));

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 shrink-0 z-30">
      {/* ── Fila 1 (móvil): Título + CTA ── */}
      <div className="flex items-center justify-between py-2 md:hidden">
        <h1 className="text-lg font-black italic uppercase text-slate-900">
          Agenda
        </h1>
        <button
          onClick={onNewAppointment}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-black uppercase rounded-xl hover:bg-teal-600 transition-colors tracking-wider flex items-center gap-2"
        >
          <Plus size={14} weight="bold" />
          <span>Agendar</span>
        </button>
      </div>

      {/* ── Fila 2 (móvil): Navegación ── */}
      <div className="flex items-center gap-2 py-2 md:hidden">
        {/* Navegador de semana */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1">
          <button
            onClick={() => goWeek(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500 font-bold"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div className="px-2 text-center min-w-28">
            <p className="text-sm font-black text-slate-900 leading-none">
              {formatWeekRange(weekStart)}
            </p>
          </div>
          <button
            onClick={() => goWeek(1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500 font-bold"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>
        {/* Esta semana */}
        <button
          onClick={goThisWeek}
          className="px-2.5 py-1.5 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:bg-teal-600 transition-colors"
        >
          Esta semana
        </button>
      </div>

      {/* ── Fila única desktop ── */}
      <div className="hidden md:flex items-center gap-3 py-3">
        <h1 className="text-xl font-black italic uppercase text-slate-900 mr-2">
          Agenda
        </h1>

        {/* Navegador de semana */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1">
          <button
            onClick={() => goWeek(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500 font-bold"
          >
            <CaretLeft size={16} weight="bold" />
          </button>
          <div className="px-3 text-center min-w-40">
            <p className="text-sm font-black text-slate-900 leading-none">
              {formatWeekRange(weekStart)}
            </p>
          </div>
          <button
            onClick={() => goWeek(1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500 font-bold"
          >
            <CaretRight size={16} weight="bold" />
          </button>
        </div>

        <button
          onClick={goThisWeek}
          className="px-4 py-2 bg-primary text-white text-xs font-black uppercase rounded-xl hover:bg-teal-600 transition-colors"
        >
          Esta semana
        </button>

        <input
          type="date"
          value={weekStart.toISOString().split("T")[0]}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-");
            onWeekChange(getWeekStart(new Date(+y, +m - 1, +d)));
          }}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-slate-50"
        />

        {/* Filtro por cabina */}
        <div className="relative">
          <select
            value={filterRoom}
            onChange={(e) => onFilterRoom(e.target.value)}
            className="appearance-none w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white cursor-pointer hover:border-slate-300 outline-none focus:border-indigo-500 transition-all"
          >
            {ROOMS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <CaretDownIcon size={14} weight="bold" />
          </div>
        </div>

        {/* Filtro por doctor */}
        {staff.length > 0 && (
          <div className="relative">
            <select
              value={filterDoctor}
              onChange={(e) => onFilterDoctor(e.target.value)}
              className="appearance-none w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white cursor-pointer hover:border-slate-300 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="ALL">Todos los doctores</option>
              {staff.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <CaretDownIcon size={14} weight="bold" />
            </div>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={onNewAppointment}
          className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black uppercase rounded-xl hover:bg-teal-600 transition-colors tracking-wider flex items-center gap-2"
        >
          <Plus size={16} weight="bold" />
          <span>Agendar</span>
        </button>
      </div>
    </header>
  );
}
