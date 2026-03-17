"use client";
import { Pill, Notepad } from "@phosphor-icons/react";

const BackgroundHabitsSection = ({ formData, setFormData }) => {
  const habits = formData.medicalHistory.habits;

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
    <div className="space-y-10 animate-in fade-in duration-500 pb-10">
      {/* 🌟 SECCIÓN: ESTILO DE VIDA */}
      <section className="space-y-6">
        <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b border-slate-100 pb-2">
          Antecedentes No Patológicos (Hábitos)
        </h4>

        <div className="grid grid-cols-1 gap-4">
          {/* TABACO, ALCOHOL, DROGAS, EJERCICIO (El mismo código que ya teníamos, limpio y sin cirugías) */}
          <div
            className={`p-6 border rounded-4xl transition-all ${habits.tobacco.does ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <label className="text-[11px] font-black uppercase text-slate-700 italic">
                ¿Fumas Tabaco?
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() =>
                      updateHabits("tobacco", { ...habits.tobacco, does: v })
                    }
                    className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${habits.tobacco.does === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {habits.tobacco.does && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 animate-in zoom-in-95 duration-300">
                <input
                  type="text"
                  placeholder="¿QUÉ TANTO FUMAS AL DÍA?"
                  className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-100"
                  value={habits.tobacco.frequency}
                  onChange={(e) =>
                    updateHabits("tobacco", {
                      ...habits.tobacco,
                      frequency: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="¿CUÁNDO FUE LA ÚLTIMA VEZ?"
                  className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-100"
                  value={habits.tobacco.lastTime}
                  onChange={(e) =>
                    updateHabits("tobacco", {
                      ...habits.tobacco,
                      lastTime: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>

          <div
            className={`p-6 border rounded-4xl transition-all ${habits.alcohol.does ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <label className="text-[11px] font-black uppercase text-slate-700 italic">
                ¿Tomas Alcohol?
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() =>
                      updateHabits("alcohol", { ...habits.alcohol, does: v })
                    }
                    className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${habits.alcohol.does === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {habits.alcohol.does && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 animate-in zoom-in-95 duration-300">
                <input
                  type="text"
                  placeholder="¿QUÉ TANTO TOMAS?"
                  className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-100"
                  value={habits.alcohol.frequency}
                  onChange={(e) =>
                    updateHabits("alcohol", {
                      ...habits.alcohol,
                      frequency: e.target.value,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="¿CUÁNDO FUE LA ÚLTIMA VEZ?"
                  className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-100"
                  value={habits.alcohol.lastTime}
                  onChange={(e) =>
                    updateHabits("alcohol", {
                      ...habits.alcohol,
                      lastTime: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>

          <div
            className={`p-6 border rounded-4xl transition-all ${habits.drugs.does ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
              <label className="text-[11px] font-black uppercase text-slate-700 italic">
                ¿Usas alguna droga?
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() =>
                      updateHabits("drugs", { ...habits.drugs, does: v })
                    }
                    className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${habits.drugs.does === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {habits.drugs.does && (
              <div className="space-y-4 mt-4 animate-in zoom-in-95 duration-300">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    ¿De qué tipo?
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["marijuana", "cocaine", "crystal"].map((drug) => (
                      <button
                        key={drug}
                        type="button"
                        onClick={() => {
                          const current = habits.drugs.types;
                          updateHabits("drugs", {
                            ...habits.drugs,
                            types: { ...current, [drug]: !current[drug] },
                          });
                        }}
                        className={`py-3 rounded-xl text-[9px] font-black border-2 transition-all ${habits.drugs.types[drug] ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-500"}`}
                      >
                        {drug === "marijuana"
                          ? "MARIGUANA"
                          : drug === "cocaine"
                            ? "COCAÍNA"
                            : "CRISTAL"}
                      </button>
                    ))}
                    <input
                      type="text"
                      placeholder="OTRA (ESPECIFICAR)"
                      className="px-3 py-2 bg-white rounded-xl text-[9px] font-bold uppercase outline-none border-2 border-slate-200 focus:border-indigo-300"
                      value={habits.drugs.types.other}
                      onChange={(e) =>
                        updateHabits("drugs", {
                          ...habits.drugs,
                          types: {
                            ...habits.drugs.types,
                            other: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="¿CADA CUÁNDO LA(S) USAS?"
                    className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-100"
                    value={habits.drugs.frequency}
                    onChange={(e) =>
                      updateHabits("drugs", {
                        ...habits.drugs,
                        frequency: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="¿CUÁNDO FUE LA ÚLTIMA VEZ?"
                    className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-100"
                    value={habits.drugs.lastTime}
                    onChange={(e) =>
                      updateHabits("drugs", {
                        ...habits.drugs,
                        lastTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className={`p-5 border rounded-4xl transition-all ${habits.exercise.does ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black uppercase text-slate-700 italic">
                  ¿Haces Ejercicio?
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() =>
                        updateHabits("exercise", {
                          ...habits.exercise,
                          does: v,
                        })
                      }
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black ${habits.exercise.does === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                    >
                      {v ? "SÍ" : "NO"}
                    </button>
                  ))}
                </div>
              </div>
              {habits.exercise.does && (
                <input
                  type="text"
                  placeholder="¿DE QUÉ TIPO?"
                  className="w-full p-3 bg-white rounded-xl text-[9px] font-bold uppercase outline-none border border-slate-100 animate-in zoom-in-95"
                  value={habits.exercise.type}
                  onChange={(e) =>
                    updateHabits("exercise", {
                      ...habits.exercise,
                      type: e.target.value,
                    })
                  }
                />
              )}
            </div>

            <div
              className={`p-5 border rounded-4xl transition-all ${habits.supplements.does ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-black uppercase text-slate-700 italic">
                  ¿Tomas Suplementos o Medicamentos?
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() =>
                        updateHabits("supplements", {
                          ...habits.supplements,
                          does: v,
                        })
                      }
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black ${habits.supplements.does === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                    >
                      {v ? "SÍ" : "NO"}
                    </button>
                  ))}
                </div>
              </div>
              {habits.supplements.does && (
                <input
                  type="text"
                  placeholder="¿CUÁLES?"
                  className="w-full p-3 bg-white rounded-xl text-[9px] font-bold uppercase outline-none border border-slate-100 animate-in zoom-in-95"
                  value={habits.supplements.detail}
                  onChange={(e) =>
                    updateHabits("supplements", {
                      ...habits.supplements,
                      detail: e.target.value,
                    })
                  }
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🌟 SECCIÓN: TRATAMIENTOS PREVIOS */}
      <section className="space-y-6">
        <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b border-slate-100 pb-2">
          Tratamientos Estéticos Previos
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { id: "massages", label: "MASAJES" },
            { id: "mesotherapy", label: "MESOTERAPIA" },
            { id: "cavitation", label: "CAVITACIÓN" },
            { id: "hydrolipoclasy", label: "HIDROLIPOCLASIA" },
            { id: "cryolipolysis", label: "CRIOLIPÓLISIS" },
            { id: "radiofrequency", label: "RADIOFRECUENCIA" },
            { id: "fillers", label: "RELLENOS" },
          ].map((t) => {
            const isSelected = habits.previousTreatments[t.id];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  updateHabits("previousTreatments", {
                    ...habits.previousTreatments,
                    [t.id]: !isSelected,
                  })
                }
                className={`p-4 rounded-2xl text-[9px] font-black transition-colors text-left flex items-center justify-between group ${
                  isSelected
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-slate-50 text-slate-500 hover:bg-indigo-50"
                }`}
              >
                {t.label}
                <div
                  className={`w-4 h-4 rounded-full border-2 transition-colors ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-slate-200 group-hover:border-indigo-400"}`}
                />
              </button>
            );
          })}
        </div>
      </section>
      
    </div>
  );
};

export default BackgroundHabitsSection;
