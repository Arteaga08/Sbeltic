"use client";
import { useScrollLock } from "@/hooks/useScrollLock";

const DAYS = [
  { day: 1, label: "Lun" },
  { day: 2, label: "Mar" },
  { day: 3, label: "Mié" },
  { day: 4, label: "Jue" },
  { day: 5, label: "Vie" },
  { day: 6, label: "Sáb" },
  { day: 0, label: "Dom" },
];

export default function TeamModal({
  isOpen,
  onClose,
  newUser,
  setNewUser,
  onSubmit,
  isEditing,
}) {
  useScrollLock(isOpen);
  if (!isOpen) return null;

  const schedule = newUser.schedule || [];

  const isDayActive = (day) => schedule.some((s) => s.day === day);

  const toggleDay = (day) => {
    if (isDayActive(day)) {
      setNewUser({ ...newUser, schedule: schedule.filter((s) => s.day !== day) });
    } else {
      setNewUser({
        ...newUser,
        schedule: [...schedule, { day, startTime: "09:00", endTime: "18:00" }],
      });
    }
  };

  const updateDayTime = (day, field, value) => {
    setNewUser({
      ...newUser,
      schedule: schedule.map((s) => (s.day === day ? { ...s, [field]: value } : s)),
    });
  };

  return (
   <div className="fixed inset-0 w-full h-dvh z-999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-modal border-2 border-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header - Respetando estilos originales */}
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h3 className="text-2xl font-extrabold italic uppercase text-slate-900 leading-none">
              {isEditing
                ? "Editar Miembro del Equipo"
                : "Nuevo Miembro del Equipo"}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              {isEditing
                ? "Actualización de credenciales"
                : "Plataforma de registro Sbeltic"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 transition-colors font-black text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8 pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                Nombre Completo
              </label>
              <input
                required
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-slate-900 font-bold text-sm"
                placeholder="Ej. Sofia Gomez"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                Email de Cuenta
              </label>
              <input
                type="email"
                required
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-slate-900 font-bold text-sm"
                placeholder="sofia@sbeltic.com"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
            </div>

            {/* Contraseña - Label con lógica de edición */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex justify-between">
                <span>Contraseña</span>
                <span className="text-[8px] text-rose-500 font-bold">
                  {isEditing
                    ? "Dejar vacío para no cambiar"
                    : "Req: 8+ car, 1 Mayús, 1 Núm"}
                </span>
              </label>
              <input
                type="password"
                required={!isEditing} // 👈 Deja de ser obligatorio si editamos
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-slate-900 font-bold text-sm"
                placeholder="••••••••"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
                Teléfono
              </label>
              <input
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-slate-900 font-bold text-sm"
                placeholder="6181234567"
                value={newUser.phone}
                onChange={(e) =>
                  setNewUser({ ...newUser, phone: e.target.value })
                }
              />
            </div>
          </div>

          {/* Selector de Rol */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">
              Rol del Usuario
            </label>
            <select
              className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 appearance-none text-sm"
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="RECEPTIONIST">RECEPTIONIST</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="MARKETING">MARKETING</option>
              <option value="NURSE">ENFERMERÍA</option>
              <option value="PHYSIOTHERAPIST">FISIOTERAPIA</option>
            </select>
          </div>

          {/* Horario de Trabajo */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 block">
              Horario de Trabajo
              <span className="ml-2 text-[8px] font-bold text-slate-300 normal-case tracking-normal">
                (opcional — dejar vacío si no aplica)
              </span>
            </label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map(({ day, label }) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isDayActive(day)
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {schedule.length > 0 && (
              <div className="space-y-2 pt-1">
                {DAYS.filter(({ day }) => isDayActive(day)).map(({ day, label }) => {
                  const entry = schedule.find((s) => s.day === day);
                  return (
                    <div key={day} className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3">
                      <span className="text-[10px] font-black uppercase text-slate-500 w-8 shrink-0">
                        {label}
                      </span>
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={entry?.startTime || "09:00"}
                          onChange={(e) => updateDayTime(day, "startTime", e.target.value)}
                          className="flex-1 p-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400"
                        />
                        <span className="text-[10px] font-black text-slate-400">—</span>
                        <input
                          type="time"
                          value={entry?.endTime || "18:00"}
                          onChange={(e) => updateDayTime(day, "endTime", e.target.value)}
                          className="flex-1 p-2 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-rose-500 transition-all text-[10px] tracking-label uppercase shadow-xl shadow-slate-900/10"
            >
              {isEditing ? "Guardar Cambios" : "Confirmar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
