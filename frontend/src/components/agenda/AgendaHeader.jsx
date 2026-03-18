"use client";

// 🌟 Importamos los íconos de Phosphor Icons
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

function formatDateLabel(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Hoy";
  if (sameDay(date, tomorrow)) return "Mañana";
  if (sameDay(date, yesterday)) return "Ayer";

  return date.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function AgendaHeader({
  selectedDate,
  onDateChange,
  filterRoom,
  onFilterRoom,
  staff = [],
  filterDoctor,
  onFilterDoctor,
  onNewAppointment,
}) {
  const goDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    onDateChange(d);
  };

  const goToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    onDateChange(d);
  };

  const dateLabel = formatDateLabel(selectedDate);
  const fullDate = selectedDate.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex flex-wrap items-center gap-3 shrink-0 z-30">
      {/* Título */}
      <h1 className="text-xl font-black italic uppercase text-slate-900 hidden lg:block mr-2">
        Agenda
      </h1>

      {/* Navegador de fecha */}
      <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-2xl p-1">
        <button
          onClick={() => goDay(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500 font-bold"
        >
          {/* 🌟 Ícono de flecha izquierda */}
          <CaretLeft size={16} weight="bold" />
        </button>
        <div className="px-3 text-center min-w-22">
          <p className="text-sm font-black text-slate-900 leading-none">
            {dateLabel}
          </p>
          <p className="text-[9px] text-slate-400 capitalize leading-none mt-0.5">
            {fullDate}
          </p>
        </div>
        <button
          onClick={() => goDay(1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-500 font-bold"
        >
          {/* 🌟 Ícono de flecha derecha */}
          <CaretRight size={16} weight="bold" />
        </button>
      </div>

      {/* Botón Hoy */}
      <button
        onClick={goToday}
        className="px-4 py-2 bg-primary text-white text-xs font-black uppercase rounded-xl hover:bg-teal-600 transition-colors"
      >
        Hoy
      </button>

      {/* Input de fecha directo */}
      <input
        type="date"
        value={selectedDate.toISOString().split("T")[0]}
        onChange={(e) => {
          const [y, m, d] = e.target.value.split("-");
          onDateChange(new Date(+y, +m - 1, +d));
        }}
        className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hidden md:block"
      />

      {/* Filtro por cabina */}
      <div className="relative hidden sm:block">
        <select
          value={filterRoom}
          onChange={(e) => onFilterRoom(e.target.value)}
          // 🌟 appearance-none quita la flecha nativa. pr-8 deja el espacio para la nuestra.
          className="appearance-none w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white cursor-pointer hover:border-slate-300 outline-none focus:border-indigo-500 transition-all"
        >
          {ROOMS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        {/* 🌟 Nuestra flecha Phosphor, separada del borde con right-3 */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <CaretDownIcon size={14} weight="bold" />
        </div>
      </div>

      {/* Filtro por doctor */}
      {staff.length > 0 && (
        <div className="relative hidden md:block">
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA */}
      <button
        onClick={onNewAppointment}
        className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black uppercase rounded-xl hover:bg-teal-600 transition-colors tracking-wider flex items-center gap-2"
      >
        {/* 🌟 Ícono de Plus en lugar del texto "+" */}
        <Plus size={16} weight="bold" />
        Nueva Cita
      </button>
    </header>
  );
}
