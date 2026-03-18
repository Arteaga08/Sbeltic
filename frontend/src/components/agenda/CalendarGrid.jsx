"use client";

import { useEffect, useRef, useState } from "react";
import AppointmentBlock from "./AppointmentBlock";

const SLOT_HEIGHT_PX = 60;
const START_HOUR = 7;
const END_HOUR = 23;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 32 slots de 30min
const TOTAL_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT_PX; // 1920px

const ROOM_LABELS = {
  CABINA_1: "Cabina 1",
  CABINA_2: "Cabina 2",
  CABINA_3: "Cabina 3",
  SPA: "Spa",
  CONSULTORIO: "Consultorio",
  QUIROFANO: "Quirófano",
};

function getBlockPosition(appointmentDate, duration) {
  const date = new Date(appointmentDate);
  const minutesFromStart =
    (date.getHours() - START_HOUR) * 60 + date.getMinutes();
  const top = (minutesFromStart / 30) * SLOT_HEIGHT_PX;
  const height = Math.max((duration / 30) * SLOT_HEIGHT_PX, SLOT_HEIGHT_PX);
  return { top, height };
}

function formatSlotTime(slotIndex) {
  const totalMinutes = START_HOUR * 60 + slotIndex * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function computeOverlaps(appointments) {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate),
  );

  const items = sorted.map((appt) => ({
    appt,
    start: new Date(appt.appointmentDate).getTime(),
    end:
      new Date(appt.appointmentDate).getTime() +
      (appt.duration || 30) * 60000,
    colIdx: 0,
    totalCols: 1,
  }));

  // Asignar columna (greedy)
  for (let i = 0; i < items.length; i++) {
    const usedCols = new Set();
    for (let j = 0; j < i; j++) {
      if (items[j].end > items[i].start) usedCols.add(items[j].colIdx);
    }
    let col = 0;
    while (usedCols.has(col)) col++;
    items[i].colIdx = col;
  }

  // Calcular totalCols por grupo de solapamientos
  for (let i = 0; i < items.length; i++) {
    let maxCol = items[i].colIdx;
    for (let j = 0; j < items.length; j++) {
      if (
        i !== j &&
        items[j].start < items[i].end &&
        items[j].end > items[i].start
      ) {
        maxCol = Math.max(maxCol, items[j].colIdx);
      }
    }
    items[i].totalCols = maxCol + 1;
  }

  return items;
}

export default function CalendarGrid({
  appointments = [],
  filterRoom = "ALL",
  onAppointmentClick,
  isToday = false,
}) {
  const [currentTimeTop, setCurrentTimeTop] = useState(null);
  const scrollRef = useRef(null);

  const activeAppointments = appointments.filter(
    (a) => a.status !== "CANCELLED",
  );

  // Calcular posición de la hora actual
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const mins = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
      if (mins >= 0 && mins <= (END_HOUR - START_HOUR) * 60) {
        setCurrentTimeTop(48 + (mins / 30) * SLOT_HEIGHT_PX);
      } else {
        setCurrentTimeTop(null);
      }
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, []);

  // Scroll automático: a hora actual si es hoy, al inicio si es otro día
  useEffect(() => {
    if (!scrollRef.current) return;
    if (isToday && currentTimeTop !== null) {
      scrollRef.current.scrollTop = Math.max(0, currentTimeTop - 150);
    } else if (!isToday) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentTimeTop, isToday]);

  const headerLabel =
    filterRoom === "ALL"
      ? "Todas las cabinas"
      : (ROOM_LABELS[filterRoom] ?? filterRoom);

  return (
    <div ref={scrollRef} className="flex-1 min-w-0 overflow-auto bg-slate-50">
      <div className="flex" style={{ minHeight: TOTAL_HEIGHT + 48 }}>

        {/* Gutter de horas */}
        <div className="w-14 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-20">
          <div className="h-12 border-b border-slate-200" />
          <div className="relative" style={{ height: TOTAL_HEIGHT }}>
            {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: i * SLOT_HEIGHT_PX, height: SLOT_HEIGHT_PX }}
              >
                {i % 2 === 0 && (
                  <span className="text-[10px] font-bold text-slate-400 -translate-y-2">
                    {formatSlotTime(i)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Columna única */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-12 flex items-center px-4 border-b border-slate-200 bg-white sticky top-0 z-10">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {headerLabel}
            </span>
          </div>

          {/* Grid de slots + citas */}
          <div className="relative flex-1" style={{ height: TOTAL_HEIGHT }}>
            {/* Líneas de slots */}
            {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
              <div
                key={i}
                className={`absolute w-full border-b ${
                  i % 2 === 0 ? "border-slate-150" : "border-slate-100"
                }`}
                style={{ top: i * SLOT_HEIGHT_PX, height: SLOT_HEIGHT_PX }}
              />
            ))}

            {/* Bloques de citas con overlap detection */}
            {computeOverlaps(activeAppointments).map(
              ({ appt, colIdx, totalCols }) => {
                const { top, height } = getBlockPosition(
                  appt.appointmentDate,
                  appt.duration,
                );
                return (
                  <AppointmentBlock
                    key={appt._id}
                    appointment={appt}
                    position={{ top, height, colIdx, totalCols }}
                    onClick={() => onAppointmentClick?.(appt)}
                  />
                );
              },
            )}

            {/* Indicador de hora actual */}
            {currentTimeTop !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: currentTimeTop - 48 }}
              >
                <div className="relative flex items-center">
                  <div className="w-2 h-2 bg-rose-500 rounded-full shrink-0 -ml-1" />
                  <div className="flex-1 h-px bg-rose-500 opacity-70" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
