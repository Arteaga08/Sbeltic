"use client";
import {
  User,
  Phone,
  EnvelopeSimple,
  UsersThree,
  WhatsappLogo,
  Notepad,
  CalendarBlank,
} from "@phosphor-icons/react";

const BasicInfoForm = ({ formData, setFormData }) => {
  // 🌟 Manejador para campos de primer nivel (name, phone, email, etc)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🌟 Manejador para el motivo de visita (currentCondition es String en nuestro modelo)
  const handleReasonChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      medicalHistory: {
        ...(prev?.medicalHistory || {}),
        currentCondition: value, // Guardamos el texto directo
      },
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* 🌟 MOTIVO DE VISITA (Solo para "OTHER") */}
      {formData?.patientType === "OTHER" && (
        <div className="space-y-2 animate-in zoom-in-95 duration-300">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 ml-2 flex items-center gap-2">
            <Notepad size={14} weight="fill" /> ¿A qué se debe la visita?
          </label>
          <textarea
            placeholder="EJ. MANTENIMIENTO DE AIRES, ENTREGA DE INSUMOS, VISITA ADMINISTRATIVA..."
            className="w-full px-6 py-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-3xl outline-none focus:border-indigo-400 transition-all font-bold text-[10px] uppercase tracking-widest min-h-20"
            // 🛡️ Fallback a string vacío para evitar error de controlados
            value={formData?.medicalHistory?.currentCondition || ""}
            onChange={(e) => handleReasonChange(e.target.value)}
          />
        </div>
      )}

      {/* NOMBRE COMPLETO */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
          Nombre del Paciente o Visitante
        </label>
        <div className="relative group">
          <User
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
          />
          <input
            type="text"
            name="name"
            value={formData?.name || ""}
            onChange={handleChange}
            placeholder="Ej. Alejandra Mendoza Ruiz..."
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TELÉFONO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
            WhatsApp / Teléfono
          </label>
          <div className="relative group">
            <Phone
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
            />
            <input
              type="tel"
              name="phone"
              value={formData?.phone || ""}
              onChange={handleChange}
              placeholder="10 DÍGITOS"
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-xs tracking-widest"
            />
          </div>
        </div>

        {/* EMAIL */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
            Correo (Opcional)
          </label>
          <div className="relative group">
            <EnvelopeSimple
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
            />
            <input
              type="email"
              name="email"
              value={formData?.email || ""}
              onChange={handleChange}
              placeholder="CORREO@EJEMPLO.COM"
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600/20 transition-all font-bold text-[11px] lowercase tracking-widest"
            />
          </div>
        </div>
      </div>

      {/* FECHA DE NACIMIENTO */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
          <CalendarBlank size={14} /> Fecha de Nacimiento (Opcional)
        </label>
        <div className="relative group">
          <CalendarBlank
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
          />
          <input
            type="date"
            name="dateOfBirth"
            value={formData?.dateOfBirth || ""}
            onChange={handleChange}
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-xs tracking-widest"
          />
        </div>
      </div>

      {/* REFERIDO POR */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
          <UsersThree size={14} /> ¿Cómo se enteró de nosotros?
        </label>
        <input
          type="text"
          name="referredBy"
          value={formData?.referredBy || ""}
          onChange={handleChange}
          placeholder="EJ. INSTAGRAM, RECOMENDACIÓN DE ANA LÓPEZ..."
          className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-[10px] uppercase tracking-widest"
        />
      </div>

      {/* WHATSAPP TOGGLE */}
      <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-[2.5rem] border border-emerald-100/50 mt-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
            <WhatsappLogo size={24} weight="fill" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-900 uppercase italic">
              Aviso de Confirmación
            </p>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
              ¿Podemos enviarle recordatorios?
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={!!formData?.allowsWhatsAppNotifications}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                allowsWhatsAppNotifications: e.target.checked,
              }))
            }
          />
          <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    </div>
  );
};

export default BasicInfoForm;
