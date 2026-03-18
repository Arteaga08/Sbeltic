"use client";

import { Heartbeat, WhatsappLogo } from "@phosphor-icons/react";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function cleanPhone(phone) {
  return (phone || "").replace(/[\s\-()]/g, "");
}

export default function PostOpTrackerWidget({ patients }) {
  const handleWhatsApp = (patient, treatmentName) => {
    const phone = cleanPhone(patient?.phone);
    if (!phone) return;
    const message = encodeURIComponent(
      `Hola ${patient.name}, le escribimos de Sbeltic para dar seguimiento a su procedimiento de ${treatmentName}. ¿Cómo se ha sentido?`
    );
    window.open(`https://wa.me/52${phone}?text=${message}`, "_blank");
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <h3 className="text-[9px] font-black uppercase tracking-widest text-blue-500">
            Post-Op Tracker
          </h3>
        </div>
        {patients.length > 0 && (
          <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
            {patients.length}
          </span>
        )}
      </div>

      {patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
            <Heartbeat size={24} weight="bold" className="text-blue-300" />
          </div>
          <p className="text-xs font-bold text-slate-400">
            Sin pacientes post-operatorios recientes
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {patients.map((appt) => (
            <div
              key={appt._id}
              className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl"
            >
              <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center text-xs font-black text-blue-700 shrink-0 uppercase">
                {(appt.patientId?.name || "?").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-xs text-slate-800 truncate">
                  {appt.patientId?.name || "Paciente"}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  {appt.treatmentName} &middot; {formatDate(appt.appointmentDate)}
                </p>
              </div>
              <button
                onClick={() => handleWhatsApp(appt.patientId, appt.treatmentName)}
                className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded-xl flex items-center justify-center shrink-0 transition-colors active:scale-95"
                title="Enviar seguimiento WhatsApp"
              >
                <WhatsappLogo size={16} weight="bold" className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
