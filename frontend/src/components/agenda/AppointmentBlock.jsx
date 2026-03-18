"use client";

import { getCategoryById, getCategoryFromTreatment } from "@/lib/treatmentCategories";

const STATUS_DOT = {
  PENDING: "bg-amber-300",
  CONFIRMED: "bg-emerald-400",
  IN_PROGRESS: "bg-white animate-pulse",
  COMPLETED: "bg-slate-300",
  CANCELLED: "bg-rose-300",
  NO_SHOW: "bg-gray-300",
};

const ROOM_SHORT = {
  CABINA_1: "Cab. 1",
  CABINA_2: "Cab. 2",
  CABINA_3: "Cab. 3",
  SPA: "Spa",
  CONSULTORIO: "Consult.",
  QUIROFANO: "Quirófano",
};

export default function AppointmentBlock({ appointment, position, onClick }) {
  const catId = getCategoryFromTreatment(appointment.treatmentName);
  const cat = getCategoryById(catId);
  const colors = { bg: cat.gridBg, border: cat.gridBorder, text: "text-white" };

  const { top, height, colIdx = 0, totalCols = 1 } = position;
  const leftPct = (colIdx / totalCols) * 100;
  const widthPct = (1 / totalCols) * 100;

  const patientName =
    appointment.patientId?.name || appointment.patientName || "Paciente";
  const time = new Date(appointment.appointmentDate).toLocaleTimeString(
    "es-MX",
    { hour: "2-digit", minute: "2-digit", hour12: false },
  );
  const roomLabel = ROOM_SHORT[appointment.roomId] || appointment.roomId || "";

  return (
    <div
      onClick={onClick}
      className={`absolute rounded-xl cursor-pointer select-none
        ${colors.bg} ${colors.text} border ${colors.border}
        hover:brightness-110 hover:scale-[1.02] transition-all duration-100
        overflow-hidden shadow-sm z-10`}
      style={{
        top: top + 2,
        height: Math.max(height - 4, 20),
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
      }}
    >
      <div className="px-2 py-1 h-full flex flex-col justify-between">
        <div className="min-w-0">
          {/* Fila: status dot + nombre + cabina */}
          <div className="flex items-center gap-1 mb-0.5">
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[appointment.status] || "bg-white"}`}
            />
            <span className="text-[9px] font-black uppercase truncate leading-none flex-1 min-w-0">
              {patientName}
            </span>
            {roomLabel && (
              <span className="text-[7px] font-black opacity-70 shrink-0 bg-black/10 rounded px-1 leading-tight">
                {roomLabel}
              </span>
            )}
          </div>
          {height >= 80 && (
            <p className="text-[8px] font-bold opacity-80 truncate leading-none mt-0.5">
              {appointment.treatmentName}
            </p>
          )}
        </div>
        {height >= 100 && (
          <span className="text-[8px] font-bold opacity-70 self-end leading-none">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}
