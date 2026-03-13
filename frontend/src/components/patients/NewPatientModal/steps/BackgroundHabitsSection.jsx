"use client";
import {
  Pill,
  Syringe,
  Virus,
  Barbell,
  Notepad,
  Warning,
} from "@phosphor-icons/react";

const BackgroundHabitsSection = ({ formData, setFormData }) => {
  const updatePath = (field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        pathological: {
          ...formData.medicalHistory.pathological,
          [field]: value,
        },
      },
    });
  };

  const updateHabits = (field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        habits: { ...formData.medicalHistory.habits, [field]: value },
      },
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-10">
      {/* SECCIÓN: CIRUGÍAS Y MÉDICOS */}
      <section className="space-y-6">
        <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b border-slate-100 pb-2">
          Antecedentes Patológicos
        </h4>

        <div className="p-6 bg-slate-50 rounded-[2.5rem] space-y-4">
          <label className="text-xs font-black uppercase text-slate-700 italic">
            ¿Te han operado alguna vez? (Estéticas y no estéticas)
          </label>
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                onClick={() =>
                  updatePath("surgeries", {
                    ...formData.medicalHistory.pathological.surgeries,
                    has: v,
                  })
                }
                className={`flex-1 py-3 rounded-2xl font-black text-[10px] transition-all ${formData.medicalHistory.pathological.surgeries.has === v ? "bg-indigo-600 text-white shadow-lg" : "bg-white text-slate-400"}`}
              >
                {v ? "SÍ" : "NO"}
              </button>
            ))}
          </div>
          {formData.medicalHistory.pathological.surgeries.has && (
            <textarea
              placeholder="¿DE QUÉ Y EN QUÉ FECHAS? / COMPLICACIONES..."
              className="w-full p-5 bg-white rounded-3xl text-[10px] font-bold uppercase outline-none min-h-25"
              onChange={(e) =>
                updatePath("surgeries", {
                  ...formData.medicalHistory.pathological.surgeries,
                  detail: e.target.value,
                })
              }
            />
          )}
        </div>
      </section>

      {/* SECCIÓN: HÁBITOS (TABACO, ALCOHOL, DROGAS) */}
      <section className="space-y-6">
        <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b border-slate-100 pb-2">
          Estilo de Vida
        </h4>

        {/* Drogas Específicas del Cuestionario */}
        <div className="p-6 border border-slate-100 rounded-[2.5rem] space-y-4">
          <label className="text-xs font-black uppercase text-slate-700 italic flex items-center gap-2">
            Uso de sustancias (Marihuana, Cocaína, Cristal, etc.)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {["marijuana", "cocaine", "crystal"].map((drug) => (
              <button
                key={drug}
                onClick={() => {
                  const current = formData.medicalHistory.habits.drugs.types;
                  updateHabits("drugs", {
                    ...formData.medicalHistory.habits.drugs,
                    types: { ...current, [drug]: !current[drug] },
                  });
                }}
                className={`py-3 rounded-xl text-[9px] font-black border-2 transition-all ${formData.medicalHistory.habits.drugs.types[drug] ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-white border-slate-50 text-slate-400"}`}
              >
                {drug.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN: TRATAMIENTOS PREVIOS */}
      <section className="space-y-6">
        <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b border-slate-100 pb-2">
          Tratamientos Previos
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            "MASAJES",
            "MESOTERAPIA",
            "CAVITACIÓN",
            "HIDROLIPOCLASIA",
            "CRIOLIPÓLISIS",
            "RADIOFRECUENCIA",
            "RELLENOS",
          ].map((t) => (
            <button
              key={t}
              className="p-4 bg-slate-50 rounded-2xl text-[9px] font-black text-slate-500 hover:bg-indigo-50 transition-colors text-left flex items-center justify-between group"
            >
              {t}{" "}
              <div className="w-4 h-4 rounded-full border-2 border-slate-200 group-hover:border-indigo-400" />
            </button>
          ))}
        </div>
      </section>

      {/* MOTIVO DE CONSULTA (LO MÁS IMPORTANTE) */}
      <section className="p-8 bg-indigo-900 rounded-[3rem] text-white space-y-4 shadow-2xl shadow-indigo-200">
        <div className="flex items-center gap-3">
          <Notepad size={24} weight="fill" />
          <h4 className="text-sm font-black uppercase italic">
            Padecimiento Actual
          </h4>
        </div>
        <textarea
          placeholder="¿CUÁL ES EL MOTIVO DE TU CONSULTA?..."
          className="w-full p-6 bg-white/10 border border-white/20 rounded-4xl text-xs font-bold uppercase placeholder:text-white/40 outline-none focus:bg-white/20 min-h-30"
          value={formData.currentCondition.reason}
          onChange={(e) =>
            setFormData({
              ...formData,
              currentCondition: { reason: e.target.value },
            })
          }
        />
      </section>
    </div>
  );
};

export default BackgroundHabitsSection;
