"use client";
import { GenderFemale, Calendar } from "@phosphor-icons/react";

const GynecoSection = ({ formData, setFormData }) => {
  const updateGyneco = (field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        gyneco: { ...formData.medicalHistory.gyneco, [field]: value },
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* EMBARAZOS Y PARTOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: "pregnancies", label: "Gestas", sub: "Embarazos" },
          { id: "births", label: "Partos", sub: "Naturales" },
          { id: "cesareans", label: "Cesáreas", sub: "Cirugías" },
          { id: "abortions", label: "Abortos", sub: "Pérdidas" },
        ].map((item) => (
          <div
            key={item.id}
            className="p-4 bg-slate-50 rounded-3xl flex flex-col items-center"
          >
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
              {item.label}
            </span>
            <input
              type="number"
              className="w-full bg-transparent text-center font-black text-xl text-indigo-600 outline-none"
              value={formData.medicalHistory.gyneco[item.id]}
              onChange={(e) => updateGyneco(item.id, e.target.value)}
            />
            <span className="text-[7px] font-bold text-slate-300 uppercase italic mt-1">
              {item.sub}
            </span>
          </div>
        ))}
      </div>

      {/* FECHAS CLAVE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-50 pt-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-slate-500 italic flex items-center gap-2">
            <Calendar size={16} /> Última Menstruación
          </label>
          <input
            type="date"
            className="w-full p-5 bg-slate-50 rounded-3xl font-bold text-xs outline-none focus:bg-indigo-50 transition-colors"
            onChange={(e) => updateGyneco("lastPeriod", e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-slate-500 italic">
            Método Anticonceptivo
          </label>
          <select
            className="w-full p-5 bg-slate-50 rounded-3xl font-bold text-[10px] uppercase outline-none appearance-none"
            onChange={(e) => updateGyneco("method", e.target.value)}
          >
            {[
              "NINGUNO",
              "PRESERVATIVO",
              "PASTILLAS",
              "ANILLO",
              "PARCHES",
              "INYECCIONES",
              "IMPLANTE",
              "DIU",
              "ESTOY OPERADA",
              "VASECTOMIA PAREJA",
            ].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default GynecoSection;
