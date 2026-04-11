"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import AppointmentBlock from "./AppointmentBlock";

const SLOT_HEIGHT_DESKTOP = 60;
const SLOT_HEIGHT_MOBILE = 40;
const START_HOUR = 7;
const END_HOUR = 23;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 32 slots de 30min

function getBlockPosition(appointmentDate, duration, slotHeight) {
  const date = new Date(appointmentDate);
  const minutesFromStart =
    (date.getHours() - START_HOUR) * 60 + date.getMinutes();
  const top = (minutesFromStart / 30) * slotHeight;
  const height = Math.max((duration / 30) * slotHeight, slotHeight);
  return { top, height };
}

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768
  );
  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return mobile;
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

// ── Cabecera de un día ──
function DayHeader({ day, colMinWidth }) {
  const isToday = day.toDateString() === new Date().toDateString();
  const name = day
    .toLocaleDateString("es-MX", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
  const num = day.getDate();

  return (
    <div
      className={`flex flex-col items-center justify-center border-r border-slate-200 text-xs gap-0.5
        ${isToday ? "text-indigo-600" : "text-slate-500"}`}
      style={{ width: colMinWidth, flexShrink: 0 }}
    >
      <span className="font-bold text-[10px] tracking-wide">{name}</span>
      <span
        className={`text-base font-black leading-none w-7 h-7 flex items-center justify-center rounded-full
          ${isToday ? "bg-indigo-600 text-white" : ""}`}
      >
        {num}
      </span>
    </div>
  );
}

// ── Columna de un día ──
function DayColumn({ appointments, filterRoom, onAppointmentClick, currentTimeTop, colMinWidth, slotHeight, totalHeight }) {
  const filtered =
    filterRoom === "ALL"
      ? appointments
      : appointments.filter((a) => a.roomId === filterRoom);

  const active = filtered.filter((a) => a.status !== "CANCELLED");
  const placed = computeOverlaps(active);

  return (
    <div
      className="relative border-r border-slate-200"
      style={{ width: colMinWidth, flexShrink: 0, height: totalHeight }}
    >
      {/* Líneas de slots */}
      {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
        <div
          key={i}
          className={`absolute w-full border-b ${
            i % 2 === 0 ? "border-slate-200" : "border-dashed border-slate-100"
          }`}
          style={{ top: i * slotHeight, height: slotHeight }}
        />
      ))}

      {/* Bloques de citas */}
      {placed.map(({ appt, colIdx, totalCols }) => {
        const { top, height } = getBlockPosition(appt.appointmentDate, appt.duration, slotHeight);
        return (
          <AppointmentBlock
            key={appt._id}
            appointment={appt}
            position={{ top, height, colIdx, totalCols }}
            onClick={() => onAppointmentClick?.(appt)}
          />
        );
      })}

      {/* Indicador hora actual (solo hoy) */}
      {currentTimeTop !== null && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none"
          style={{ top: currentTimeTop }}
        >
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 -ml-1" />
            <div className="flex-1 h-px bg-rose-500 opacity-70" />
          </div>
        </div>
      )}
    </div>
  );
}

const GUTTER_W = 56; // px del gutter de horas

function calcColWidth() {
  if (typeof window === "undefined") return 130;
  return window.innerWidth < 768
    ? Math.floor((window.innerWidth - GUTTER_W) / 3)
    : 130;
}

function useColMinWidth() {
  const [width, setWidth] = useState(calcColWidth);
  useEffect(() => {
    const update = () => setWidth(calcColWidth());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return width;
}

export default function CalendarGrid({
  weekStart,
  appointmentsByDate = {},
  filterRoom = "ALL",
  onAppointmentClick,
}) {
  const [currentTimeTop, setCurrentTimeTop] = useState(null);
  const scrollRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const colMinWidth = useColMinWidth();
  const isMobile = useIsMobile();
  const [mobileHalf, setMobileHalf] = useState(0); // 0 = Lun-Mié, 1 = Jue-Sáb

  const slotHeight = isMobile ? SLOT_HEIGHT_MOBILE : SLOT_HEIGHT_DESKTOP;
  const totalHeight = TOTAL_SLOTS * slotHeight;

  // Array de 6 días (lun–sáb)
  const allDays = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // En móvil renderizamos los 6 días; el transform desliza entre mitades
  const visibleDays = allDays;

  // Auto-seleccionar la mitad que contiene hoy
  useEffect(() => {
    if (!isMobile) return;
    const todayIdx = allDays.findIndex(
      (d) => d.toDateString() === new Date().toDateString()
    );
    if (todayIdx >= 3) setMobileHalf(1);
    else setMobileHalf(0);
  }, [weekStart, isMobile]);

  // Swipe detection (horizontal only — ignores vertical scroll)
  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX < 0) setMobileHalf((h) => Math.min(h + 1, 1));
      else setMobileHalf((h) => Math.max(h - 1, 0));
    }
  }, []);

  // Calcular posición de la hora actual
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const mins = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
      setCurrentTimeTop(
        mins >= 0 && mins <= (END_HOUR - START_HOUR) * 60
          ? (mins / 30) * slotHeight
          : null,
      );
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [slotHeight]);

  // Auto-scroll a la hora actual si la semana contiene hoy
  useEffect(() => {
    if (!scrollRef.current || currentTimeTop === null) return;
    const todayInWeek = allDays.some(
      (d) => d.toDateString() === new Date().toDateString(),
    );
    if (todayInWeek) {
      scrollRef.current.scrollTop = Math.max(0, currentTimeTop + 48 - 150);
    }
  }, []); // solo al montar

  return (
    <div
      ref={scrollRef}
      className={`flex-1 min-w-0 bg-slate-50 ${isMobile ? "overflow-y-auto overflow-x-hidden" : "overflow-auto"}`}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <div
        className="flex"
        style={{ width: GUTTER_W + (isMobile ? 3 : allDays.length) * colMinWidth, minHeight: totalHeight + 48 }}
      >
        {/* ── Gutter de horas (sticky left) ── */}
        <div className="w-14 shrink-0 border-r border-slate-200 bg-white sticky left-0 z-30">
          {/* Celda esquina */}
          <div className="h-12 border-b border-slate-200 sticky top-0 z-30 bg-white" />
          <div className="relative" style={{ height: totalHeight }}>
            {Array.from({ length: TOTAL_SLOTS }).map((_, i) => (
              <div
                key={i}
                className="absolute w-full flex items-start justify-end pr-2"
                style={{ top: i * slotHeight, height: slotHeight }}
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

        {/* ── Columnas de días ── */}
        <div
          className="flex flex-col"
          style={isMobile ? {
            width: 6 * colMinWidth,
            transform: `translateX(-${mobileHalf * 3 * colMinWidth}px)`,
            transition: "transform 300ms ease-out",
          } : undefined}
        >
          {/* Cabecera de días (sticky top) */}
          <div className="flex h-12 border-b border-slate-200 bg-white sticky top-0 z-20">
            {visibleDays.map((day) => (
              <DayHeader key={day.toDateString()} day={day} colMinWidth={colMinWidth} />
            ))}
          </div>

          {/* Columnas con citas */}
          <div className="flex" style={{ height: totalHeight }}>
            {visibleDays.map((day) => {
              const key = day.toLocaleDateString("en-CA");
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <DayColumn
                  key={day.toDateString()}
                  appointments={appointmentsByDate[key] || []}
                  filterRoom={filterRoom}
                  onAppointmentClick={onAppointmentClick}
                  currentTimeTop={isToday ? currentTimeTop : null}
                  colMinWidth={colMinWidth}
                  slotHeight={slotHeight}
                  totalHeight={totalHeight}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
