import { MapPin, User } from "@phosphor-icons/react";

export default function AppointmentCard({ appointment }) {
  // Formatear hora (de appointmentDate)
  const time = new Date(appointment.appointmentDate).toLocaleTimeString(
    "es-MX",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    },
  );

  const statusMap = {
    PENDING: "bg-amber-100 text-amber-600 border-amber-200",
    CONFIRMED: "bg-emerald-100 text-emerald-600 border-emerald-200",
    IN_PROGRESS: "bg-blue-100 text-blue-600 border-blue-200",
    COMPLETED: "bg-slate-100 text-slate-500 border-slate-200",
    CANCELLED: "bg-rose-100 text-rose-600 border-rose-200",
    NO_SHOW: "bg-gray-100 text-gray-400 border-gray-200",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-3xl font-black text-slate-900 leading-none">
            {time}
          </h3>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
            {appointment.treatmentName}
          </span>
        </div>
        <div
          className={`px-2 py-1 rounded-lg border text-[9px] font-black ${statusMap[appointment.status]}`}
        >
          {appointment.status}
        </div>
      </div>

      <div className="mb-6">
        {/* Usamos el .populate() que ya tienes en el controlador */}
        <p className="text-lg font-bold text-slate-800">
          {appointment.patientId?.name || "Sin Paciente"}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <span className="font-bold flex items-center gap-1"><MapPin size={12} weight="bold" /> {appointment.roomId}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><User size={12} weight="bold" /> Dr. {appointment.doctorId?.name}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl text-xs font-bold border border-slate-200 hover:bg-slate-100 transition-all">
          DETALLES
        </button>
        {/* Si es touch-up, mostramos un indicador visual */}
        {appointment.isTouchUp && (
          <div className="flex items-center justify-center px-3 bg-indigo-50 text-indigo-500 rounded-2xl text-[10px] font-bold border border-indigo-100">
            RETOQUE
          </div>
        )}
      </div>
    </div>
  );
}
