"use client";

export default function TeamModal({
  isOpen,
  onClose,
  newUser,
  setNewUser,
  onSubmit,
  isEditing, // 👈 Nueva prop para detectar el modo
}) {
  if (!isOpen) return null;

  return (
   <div className="fixed inset-0 w-full h-dvh z-999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[40px] border-2 border-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-rose-500 transition-all text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-slate-900/10"
            >
              {isEditing ? "Guardar Cambios" : "Confirmar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
