"use client";
import { ClipboardText } from "@phosphor-icons/react";

const CurrentConditionSection = ({ formData, setFormData }) => {
  // 🌟 Esta constante asegura que si el valor es un objeto {}, se convierta en texto vacío ""
  const currentValue =
    typeof formData.medicalHistory?.currentCondition === "string"
      ? formData.medicalHistory.currentCondition
      : "";

  const updateCondition = (value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        currentCondition: value,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER DE SECCIÓN - Mantenemos los indicadores */}
      <header className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm">
          <ClipboardText size={24} weight="fill" />
        </div>
        <div>
          <h3 className="text-sm font-black italic uppercase text-slate-800 tracking-widest leading-none">
            Padecimiento Actual
          </h3>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Motivo de la visita o interés principal
          </p>
        </div>
      </header>

      {/* ÁREA DE TEXTO */}
      <div className="relative group">
        <textarea
          // 🌟 Nuevo placeholder más directo
          placeholder="DESCRIBE EL MOTIVO DE LA CONSULTA, PROCEDIMIENTO DE INTERÉS O SÍNTOMAS QUE PRESENTA EL PACIENTE..."
          className="w-full p-8 bg-slate-50 border-2 border-transparent rounded-[3rem] font-bold text-[11px] uppercase outline-none focus:bg-white focus:border-indigo-100 focus:ring-4 ring-indigo-50/50 transition-all min-h-62.5 resize-none leading-relaxed text-slate-700"
          // 🌟 Usamos currentValue para evitar el bug de [object Object]
          value={currentValue}
          onChange={(e) => updateCondition(e.target.value)}
        />

        {/* DECORACIÓN VISUAL - Mantenida */}
        <div className="absolute bottom-6 right-8 flex items-center gap-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Contenido del Expediente • Sbeltic Digital
        </div>
      </div>

      <div className="p-6 bg-amber-50/50 rounded-3xl border border-amber-100/50">
        <p className="text-[9px] font-bold text-amber-600 uppercase leading-relaxed text-center italic">
          * Describe de forma detallada los síntomas, expectativas o el
          tratamiento específico que el paciente desea consultar.
        </p>
      </div>
    </div>
  );
};

export default CurrentConditionSection;
