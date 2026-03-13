"use client";
import {
  IdentificationBadge,
  Calendar,
  MapPin,
  Books,
  HandsPraying,
  Syringe,
  Drop,
} from "@phosphor-icons/react";

const IdentificationSection = ({ formData, setFormData }) => {
  const updateId = (field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        identification: {
          ...formData.medicalHistory.identification,
          [field]: value,
        },
      },
    });
  };

  const updateAllergies = (type, field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        allergies: {
          ...formData.medicalHistory.allergies,
          [type]: {
            ...formData.medicalHistory.allergies[type],
            [field]: value,
          },
        },
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* DATOS BÁSICOS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="col-span-1 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Edad
          </label>
          <input
            type="number"
            placeholder="EJ. 28"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs"
            value={formData.medicalHistory.identification.age}
            onChange={(e) => updateId("age", e.target.value)}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs"
            value={formData.medicalHistory.identification.birthday}
            onChange={(e) => updateId("birthday", e.target.value)}
          />
        </div>
        <div className="col-span-full space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Dirección Actual
          </label>
          <input
            type="text"
            placeholder="CALLE, NÚMERO, COLONIA..."
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] uppercase"
            value={formData.medicalHistory.identification.address}
            onChange={(e) => updateId("address", e.target.value)}
          />
        </div>
      </div>

      {/* CULTURALES */}
      <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-6">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Nivel de Estudios
          </label>
          <select
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] appearance-none"
            value={formData.medicalHistory.identification.educationLevel}
            onChange={(e) => updateId("educationLevel", e.target.value)}
          >
            {[
              "POSGRADO",
              "CARRERA",
              "BACHILLERATO",
              "SECUNDARIA",
              "PRIMARIA",
              "SIN ESTUDIOS",
            ].map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Religión
          </label>
          <select
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] appearance-none"
            value={formData.medicalHistory.identification.religion}
            onChange={(e) => updateId("religion", e.target.value)}
          >
            {["CATOLICO", "CRISTIANA", "TESTIGO JEHOVA", "MORMON", "OTRA"].map(
              (opt) => (
                <option key={opt}>{opt}</option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* SECCIÓN CRÍTICA: ALERGIAS Y SANGRE */}
      <div className="bg-rose-50/30 p-6 rounded-[2.5rem] border border-rose-100/50 space-y-6">
        <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-2">
          <Drop size={16} weight="fill" /> Información de Riesgo
        </h4>

        {/* Sangre */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-rose-400 ml-2 italic">
            Tipo de Sangre
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              "A+",
              "A-",
              "B+",
              "B-",
              "AB+",
              "AB-",
              "O+",
              "O-",
              "DESCONOCIDO",
            ].map((t) => (
              <button
                key={t}
                onClick={() =>
                  setFormData({
                    ...formData,
                    medicalHistory: {
                      ...formData.medicalHistory,
                      vital: { bloodType: t },
                    },
                  })
                }
                className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${formData.medicalHistory.vital.bloodType === t ? "bg-rose-500 border-rose-500 text-white shadow-lg" : "bg-white border-rose-100 text-rose-400"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Alergias Dinámicas */}
        {["food", "medications", "others"].map((type) => (
          <div key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-700 italic">
                Alergia{" "}
                {type === "food"
                  ? "Alimentos"
                  : type === "medications"
                    ? "Medicamentos"
                    : "Otros"}
              </span>
              <div className="flex bg-white rounded-xl p-1 border border-rose-100">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    onClick={() => updateAllergies(type, "has", v)}
                    className={`px-4 py-1 rounded-lg text-[9px] font-black transition-all ${formData.medicalHistory.allergies[type].has === v ? "bg-rose-500 text-white" : "text-rose-300"}`}
                  >
                    {v ? "SI" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {formData.medicalHistory.allergies[type].has && (
              <input
                type="text"
                placeholder="ESPECIFICA CUALES..."
                className="w-full p-4 bg-white border border-rose-100 rounded-2xl font-bold text-[10px] uppercase animate-in slide-in-from-top-2"
                value={formData.medicalHistory.allergies[type].detail}
                onChange={(e) =>
                  updateAllergies(type, "detail", e.target.value)
                }
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdentificationSection