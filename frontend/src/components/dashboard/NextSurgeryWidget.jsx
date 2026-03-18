"use client";

import { Syringe } from "@phosphor-icons/react";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function NextSurgeryWidget({ surgery }) {
  return (
    <div className="bg-gradient-to-br from-rose-50 to-white rounded-3xl p-6 border border-rose-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-rose-500 rounded-full" />
        <h3 className="text-[9px] font-black uppercase tracking-widest text-rose-500">
          Próxima Cirugía
        </h3>
      </div>

      {!surgery ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
            <Syringe size={24} weight="bold" className="text-rose-300" />
          </div>
          <p className="text-xs font-bold text-slate-400">Sin cirugías hoy</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Hora destacada */}
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 text-white px-3 py-2 rounded-2xl">
              <p className="text-xl font-black leading-none">
                {formatTime(surgery.appointmentDate)}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                {surgery.roomId?.replace("_", " ") || "Quirófano"}
              </p>
            </div>
          </div>

          {/* Paciente */}
          <div className="bg-white rounded-2xl p-3 border border-rose-100">
            <p className="font-black text-sm text-slate-900 truncate">
              {surgery.patientId?.name || "Paciente"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              {surgery.treatmentName}
            </p>
          </div>

          {/* Status dot */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                surgery.status === "CONFIRMED"
                  ? "bg-emerald-400"
                  : surgery.status === "IN_PROGRESS"
                    ? "bg-blue-400 animate-pulse"
                    : "bg-amber-300"
              }`}
            />
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
              {surgery.status === "CONFIRMED"
                ? "Confirmada"
                : surgery.status === "IN_PROGRESS"
                  ? "En curso"
                  : "Pendiente"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
