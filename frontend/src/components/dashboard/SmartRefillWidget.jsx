"use client";

import { CalendarX } from "@phosphor-icons/react";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function SmartRefillWidget({ cancelledSlots }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full" />
          <h3 className="text-[9px] font-black uppercase tracking-widest text-amber-500">
            Smart Refill
          </h3>
        </div>
        {cancelledSlots.length > 0 && (
          <span className="text-[9px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">
            {cancelledSlots.length}
          </span>
        )}
      </div>

      {cancelledSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
            <CalendarX size={24} weight="bold" className="text-amber-300" />
          </div>
          <p className="text-xs font-bold text-slate-400">Sin cancelaciones hoy</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cancelledSlots.map((slot) => (
            <div
              key={slot._id}
              className="flex items-center gap-3 p-2.5 bg-amber-50 rounded-2xl"
            >
              <div className="text-center shrink-0 w-10">
                <p className="text-sm font-black text-amber-600 leading-none">
                  {formatTime(slot.appointmentDate)}
                </p>
                <p className="text-[8px] text-amber-400 font-bold">
                  {slot.roomId?.replace("_", " ")}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs text-slate-800 truncate">
                  {slot.treatmentName}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  {slot.patientId?.name || "Paciente"}
                </p>
              </div>
              <span className="text-[8px] font-black bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-lg shrink-0">
                LIBRE
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
