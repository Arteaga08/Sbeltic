"use client";
import {
  GenderFemale,
  WarningCircle,
  ShieldCheck,
} from "@phosphor-icons/react";

const GynecoSection = ({ formData, setFormData }) => {
  const gynecoData = formData.medicalHistory?.gyneco || {};

  const updateGyneco = (field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        gyneco: { ...gynecoData, [field]: value },
      },
    });
  };

  const methods = [
    "PRESERVATIVO",
    "PASTILLAS",
    "INYECCIONES",
    "IMPLANTE",
    "DIU",
    "ANILLO",
    "PARCHES",
    "VASECTOMÍA PAREJA",
    "ESTOY OPERADA",
    "NINGUNO",
    "OTRO",
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 1. DATOS BÁSICOS (Mismo grid y estilo que Edad/Nacimiento) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Menarca (1ra Regla)
          </label>
          <input
            type="number"
            placeholder="EDAD"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.menarcheAge || ""}
            onChange={(e) => updateGyneco("menarcheAge", e.target.value)}
          />
        </div>
        <div className="col-span-1 md:col-span-2 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Gesta (Embarazos)
          </label>
          <input
            type="number"
            placeholder="CANTIDAD"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.pregnancies || ""}
            onChange={(e) => updateGyneco("pregnancies", e.target.value)}
          />
        </div>
      </div>

      {/* 2. HISTORIAL OBSTÉTRICO Y FECHAS (Usando type="date" intuitivo) */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
        {/* Partos */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Para (Partos Nat.)
          </label>
          <input
            type="number"
            placeholder="CANTIDAD"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.naturalBirths || ""}
            onChange={(e) => updateGyneco("naturalBirths", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Fecha Últ. Parto
          </label>
          <input
            type="date"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.lastBirthDate || ""}
            onChange={(e) => updateGyneco("lastBirthDate", e.target.value)}
          />
        </div>

        {/* Cesáreas */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Cesáreas
          </label>
          <input
            type="number"
            placeholder="CANTIDAD"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.cSections || ""}
            onChange={(e) => updateGyneco("cSections", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Fecha Últ. Cesárea
          </label>
          <input
            type="date"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.lastCSectionDate || ""}
            onChange={(e) => updateGyneco("lastCSectionDate", e.target.value)}
          />
        </div>

        {/* Abortos */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Abortos
          </label>
          <input
            type="number"
            placeholder="CANTIDAD"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.abortions || ""}
            onChange={(e) => updateGyneco("abortions", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Fecha Últ. Aborto
          </label>
          <input
            type="date"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.lastAbortionDate || ""}
            onChange={(e) => updateGyneco("lastAbortionDate", e.target.value)}
          />
        </div>
      </div>

      {/* 3. COMPLICACIONES (Mismo botón dinámico SI/NO que en Identificación) */}
      <div className="space-y-3 border-t border-slate-50 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <span className="text-[10px] font-black uppercase text-slate-700 italic">
            ¿Tuviste alguna(s) complicación(es)?
          </span>
          <div className="flex bg-white rounded-xl p-1 border border-slate-100 w-fit">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => updateGyneco("hasComplications", v)}
                className={`px-5 py-2 rounded-lg text-[9px] font-black transition-all ${
                  gynecoData.hasComplications === v
                    ? "bg-rose-500 text-white"
                    : "text-slate-300 hover:text-slate-500"
                }`}
              >
                {v ? "SÍ" : "NO"}
              </button>
            ))}
          </div>
        </div>
        {gynecoData.hasComplications && (
          <input
            type="text"
            placeholder="¿DE QUÉ TIPO? ESPECIFICA..."
            className="w-full p-4 bg-white border border-rose-200 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-2 ring-rose-100 animate-in slide-in-from-top-2"
            value={gynecoData.complicationsDetail || ""}
            onChange={(e) =>
              updateGyneco("complicationsDetail", e.target.value)
            }
          />
        )}
      </div>

      {/* 4. CICLO MENSTRUAL */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-50 pt-6">
        <div className="col-span-2 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Inicio Últ. Menstruación
          </label>
          <input
            type="date"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
            value={gynecoData.lastMenstruationDate || ""}
            onChange={(e) =>
              updateGyneco("lastMenstruationDate", e.target.value)
            }
          />
        </div>

        <div className="col-span-1 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Baja cada
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
              value={gynecoData.cycleDurationDays || ""}
              onChange={(e) =>
                updateGyneco("cycleDurationDays", e.target.value)
              }
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">
              DÍAS
            </span>
          </div>
        </div>

        <div className="col-span-1 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Dura
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
              value={gynecoData.bleedingDays || ""}
              onChange={(e) => updateGyneco("bleedingDays", e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">
              DÍAS
            </span>
          </div>
        </div>

        <div className="col-span-full mt-2">
          <label className="flex items-center gap-3 cursor-pointer p-4 md:p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors w-fit border border-slate-200 md:border-2">
            <input
              type="checkbox"
              className="w-5 h-5 md:w-6 md:h-6 accent-indigo-600 rounded"
              checked={gynecoData.isIrregular || false}
              onChange={(e) => updateGyneco("isIrregular", e.target.checked)}
            />
            <span className="text-[10px] md:text-xs font-black uppercase text-slate-600 italic">
              Mi periodo es Irregular
            </span>
          </label>
        </div>
      </div>

      {/* 5. SECCIÓN CRÍTICA: MÉTODOS ANTICONCEPTIVOS (Estilo Tipo de Sangre) */}
      <div className="bg-pink-50/30 p-6 md:p-8 rounded-[2.5rem] border border-pink-100/50 space-y-6">
        <h4 className="text-[10px] font-black uppercase text-pink-500 tracking-widest flex items-center gap-2">
          <ShieldCheck size={16} weight="fill" /> Método Anticonceptivo
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {methods.map((method) => {
            const isSelected = gynecoData.contraceptiveMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => updateGyneco("contraceptiveMethod", method)}
                className={`py-3 px-2 rounded-xl text-[9px] font-black border-2 transition-all ${
                  isSelected
                    ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-200"
                    : "bg-white border-pink-100 text-pink-400 hover:border-pink-300"
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>

        {gynecoData.contraceptiveMethod === "OTRO" && (
          <input
            type="text"
            placeholder="ESPECIFICA QUÉ MÉTODO USAS..."
            className="w-full p-4 bg-white border border-pink-200 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-2 ring-pink-100 mt-2 animate-in slide-in-from-top-2"
            value={gynecoData.otherContraceptive || ""}
            onChange={(e) => updateGyneco("otherContraceptive", e.target.value)}
          />
        )}
      </div>
    </div>
  );
};

export default GynecoSection;
