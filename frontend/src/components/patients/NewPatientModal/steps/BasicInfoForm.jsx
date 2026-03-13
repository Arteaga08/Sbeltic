"use client";
import {
  User,
  Phone,
  EnvelopeSimple,
  UsersThree,
  WhatsappLogo,
} from "@phosphor-icons/react";

const BasicInfoForm = ({ formData, setFormData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* NOMBRE COMPLETO */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
          Nombre Completo
        </label>
        <div className="relative group">
          <User
            size={20}
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
          />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="EJ. ANA GARCÍA LÓPEZ"
            className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TELÉFONO */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
            Teléfono Móvil
          </label>
          <div className="relative group">
            <Phone
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
            />
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="662 123 4567"
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-xs tracking-widest"
            />
          </div>
        </div>

        {/* EMAIL */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2">
            Correo Electrónico
          </label>
          <div className="relative group">
            <EnvelopeSimple
              size={20}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="CORREO@EJEMPLO.COM"
              className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-xs uppercase tracking-widest"
            />
          </div>
        </div>
      </div>

      {/* REFERIDO POR */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-2 flex items-center gap-2">
          <UsersThree size={14} /> ¿Quién lo recomendó?
        </label>
        <input
          type="text"
          name="referredBy"
          placeholder="BUSCAR PACIENTE EXISTENTE..."
          className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-3xl outline-none focus:border-indigo-600/20 focus:bg-white transition-all font-bold text-[10px] uppercase tracking-widest"
        />
      </div>

      {/* WHATSAPP TOGGLE */}
      <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-4xl border border-emerald-100/50 mt-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
            <WhatsappLogo size={24} weight="fill" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-900 uppercase italic">
              Notificaciones
            </p>
            <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
              Enviar recordatorios por WhatsApp
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={formData.allowsWhatsAppNotifications}
            onChange={(e) =>
              setFormData({
                ...formData,
                allowsWhatsAppNotifications: e.target.checked,
              })
            }
          />
          <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>
    </div>
  );
};

export default BasicInfoForm;
