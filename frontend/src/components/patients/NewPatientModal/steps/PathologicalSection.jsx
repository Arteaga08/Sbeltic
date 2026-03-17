"use client";
import {
  Activity,
  Syringe,
  Virus,
  WarningCircle,
  Drop,
} from "@phosphor-icons/react";

const PathologicalSection = ({ formData, setFormData }) => {
  const path = formData.medicalHistory.pathological;

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="bg-rose-50/50 p-4 rounded-2xl mb-6">
        <p className="text-[9px] font-bold text-rose-500 uppercase text-center tracking-widest">
          Antecedentes Personales Patológicos (Datos Médicos Previos)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* CIRUGÍAS */}
        <div
          className={`p-6 border rounded-4xl transition-all ${path.surgeries.has ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <label className="text-[11px] font-black uppercase text-slate-700 italic">
              ¿Alguna vez te han operado?{" "}
              <span className="text-[9px] text-slate-400 normal-case">
                (Estéticas y no estéticas)
              </span>
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() =>
                    updatePath("surgeries", { ...path.surgeries, has: v })
                  }
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${path.surgeries.has === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                >
                  {v ? "SÍ" : "NO"}
                </button>
              ))}
            </div>
          </div>
          {path.surgeries.has && (
            <div className="space-y-3 mt-4 animate-in zoom-in-95 duration-300">
              <input
                type="text"
                placeholder="¿DE QUÉ TE HAN OPERADO Y EN QUÉ FECHAS?"
                className="w-full p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.surgeries.detail}
                onChange={(e) =>
                  updatePath("surgeries", {
                    ...path.surgeries,
                    detail: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="¿TUVISTE ALGUNA COMPLICACIÓN? (ESPECIFICA)"
                className="w-full p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.surgeries.complications}
                onChange={(e) =>
                  updatePath("surgeries", {
                    ...path.surgeries,
                    complications: e.target.value,
                  })
                }
              />
            </div>
          )}
        </div>

        {/* HOSPITALIZACIONES */}
        <div
          className={`p-6 border rounded-4xl transition-all ${path.hospitalized.has ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <label className="text-[11px] font-black uppercase text-slate-700 italic">
              ¿Has estado hospitalizado(a) por otro motivo?
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() =>
                    updatePath("hospitalized", { ...path.hospitalized, has: v })
                  }
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${path.hospitalized.has === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                >
                  {v ? "SÍ" : "NO"}
                </button>
              ))}
            </div>
          </div>
          {path.hospitalized.has && (
            <div className="flex flex-col md:flex-row gap-3 mt-4 animate-in zoom-in-95 duration-300">
              <input
                type="text"
                placeholder="ESPECIFICA EL MOTIVO"
                className="flex-1 p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.hospitalized.reason}
                onChange={(e) =>
                  updatePath("hospitalized", {
                    ...path.hospitalized,
                    reason: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="FECHA"
                className="w-full md:w-1/3 p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.hospitalized.date}
                onChange={(e) =>
                  updatePath("hospitalized", {
                    ...path.hospitalized,
                    date: e.target.value,
                  })
                }
              />
            </div>
          )}
        </div>

        {/* ACCIDENTES */}
        <div
          className={`p-6 border rounded-4xl transition-all ${path.accidents.has ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <label className="text-[11px] font-black uppercase text-slate-700 italic">
              ¿Has tenido algún accidente con secuelas?
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() =>
                    updatePath("accidents", { ...path.accidents, has: v })
                  }
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${path.accidents.has === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                >
                  {v ? "SÍ" : "NO"}
                </button>
              ))}
            </div>
          </div>
          {path.accidents.has && (
            <div className="space-y-3 mt-4 animate-in zoom-in-95 duration-300">
              <input
                type="text"
                placeholder="TIPO DE ACCIDENTE Y FECHA"
                className="w-full p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.accidents.detail}
                onChange={(e) =>
                  updatePath("accidents", {
                    ...path.accidents,
                    detail: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="SECUELAS"
                className="w-full p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.accidents.sequels}
                onChange={(e) =>
                  updatePath("accidents", {
                    ...path.accidents,
                    sequels: e.target.value,
                  })
                }
              />
            </div>
          )}
        </div>

        {/* MALFORMACIONES Y TRANSFUSIONES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-5 border rounded-4xl transition-all ${path.malformations.has ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black uppercase text-slate-700 italic">
                ¿Tienes alguna malformación?
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() =>
                      updatePath("malformations", {
                        ...path.malformations,
                        has: v,
                      })
                    }
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black ${path.malformations.has === v ? "bg-white text-indigo-600" : "text-slate-400"}`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {path.malformations.has && (
              <input
                type="text"
                placeholder="ESPECIFICA"
                className="w-full p-3 bg-white rounded-xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.malformations.detail}
                onChange={(e) =>
                  updatePath("malformations", {
                    ...path.malformations,
                    detail: e.target.value,
                  })
                }
              />
            )}
          </div>

          <div
            className={`p-5 border rounded-4xl transition-all ${path.transfusions.has ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black uppercase text-slate-700 italic">
                ¿Te han transfundido sangre?
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() =>
                      updatePath("transfusions", {
                        ...path.transfusions,
                        has: v,
                      })
                    }
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black ${path.transfusions.has === v ? "bg-white text-indigo-600" : "text-slate-400"}`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {path.transfusions.has && (
              <input
                type="text"
                placeholder="¿REACCIÓN ADVERSA? ESPECIFICA"
                className="w-full p-3 bg-white rounded-xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.transfusions.reaction}
                onChange={(e) =>
                  updatePath("transfusions", {
                    ...path.transfusions,
                    reaction: e.target.value,
                  })
                }
              />
            )}
          </div>
        </div>

        {/* COVID-19 */}
        <div
          className={`p-6 border rounded-4xl transition-all ${path.covid.had ? "bg-slate-50 border-indigo-100" : "bg-white border-slate-100"}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <label className="text-[11px] font-black uppercase text-slate-700 italic flex items-center gap-2">
              <Virus size={18} /> ¿Te has enfermado de COVID?
            </label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  onClick={() => updatePath("covid", { ...path.covid, had: v })}
                  className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${path.covid.had === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                >
                  {v ? "SÍ" : "NO"}
                </button>
              ))}
            </div>
          </div>
          {path.covid.had && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 animate-in zoom-in-95 duration-300">
              <input
                type="text"
                placeholder="¿CUÁNDO? (MES/AÑO)"
                className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.covid.date}
                onChange={(e) =>
                  updatePath("covid", { ...path.covid, date: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="SECUELAS"
                className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                value={path.covid.sequels}
                onChange={(e) =>
                  updatePath("covid", {
                    ...path.covid,
                    sequels: e.target.value,
                  })
                }
              />
            </div>
          )}

          <div className="border-t border-slate-200 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase text-slate-500">
                ¿Tienes Vacuna COVID?
              </span>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() =>
                      updatePath("covid", { ...path.covid, vaccine: v })
                    }
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black ${path.covid.vaccine === v ? "bg-white text-indigo-600" : "text-slate-400"}`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {path.covid.vaccine && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in zoom-in-95 duration-300">
                <input
                  type="text"
                  placeholder="¿CUÁL MARCA?"
                  className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                  value={path.covid.type}
                  onChange={(e) =>
                    updatePath("covid", { ...path.covid, type: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="FECHAS (EJ. 1RA DOSIS: 05/21, 2DA...)"
                  className="p-4 bg-white rounded-2xl text-[9px] font-bold uppercase outline-none border border-slate-200"
                  value={path.covid.doses}
                  onChange={(e) =>
                    updatePath("covid", {
                      ...path.covid,
                      doses: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathologicalSection;
