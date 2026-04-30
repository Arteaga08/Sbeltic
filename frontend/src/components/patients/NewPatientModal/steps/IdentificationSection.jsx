"use client";
import {
  IdentificationBadge,
  Calendar,
  MapPin,
  Books,
  HandsPraying,
  Syringe,
  Drop,
  Warning,
  Pill,
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

  // 🌟 Funciones para manejar las enfermedades
  const updateComorbidities = (field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        comorbidities: {
          ...formData.medicalHistory.comorbidities,
          [field]: value,
        },
      },
    });
  };

  const updateDisease = (diseaseId, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        comorbidities: {
          ...formData.medicalHistory.comorbidities,
          diseases: {
            ...formData.medicalHistory.comorbidities.diseases,
            [diseaseId]: value,
          },
        },
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* DATOS BÁSICOS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="col-span-1 space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-2 italic">
            Edad
          </label>
          <input
            type="number"
            placeholder="EJ. 28"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
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
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none focus:bg-indigo-50/50 transition-colors"
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
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] uppercase outline-none focus:bg-indigo-50/50 transition-colors"
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
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] appearance-none outline-none focus:bg-indigo-50/50 transition-colors"
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
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] appearance-none outline-none focus:bg-indigo-50/50 transition-colors"
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
      <div className="bg-rose-50/30 p-6 md:p-8 rounded-modal border border-rose-100/50 space-y-6">
        <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-widest flex items-center gap-2">
          <Drop size={16} weight="fill" /> Información de Riesgo
        </h4>

        {/* Sangre */}
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-rose-400 ml-2 italic">
            Tipo de Sangre
          </label>
          <div className="grid grid-cols-4 md:grid-cols-9 gap-2">
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "NS/NC"].map(
              (t) => {
                const val = t === "NS/NC" ? "DESCONOCIDO" : t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        medicalHistory: {
                          ...formData.medicalHistory,
                          vital: { bloodType: val },
                        },
                      })
                    }
                    className={`py-3 rounded-xl text-[9px] font-black border-2 transition-all ${
                      formData.medicalHistory.vital.bloodType === val
                        ? "bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200"
                        : "bg-white border-rose-100 text-rose-400 hover:border-rose-300"
                    }`}
                  >
                    {t}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* Alergias Dinámicas */}
        {["food", "medications", "others"].map((type) => (
          <div key={type} className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <span className="text-[10px] font-black uppercase text-slate-700 italic">
                Alergia a{" "}
                {type === "food"
                  ? "Alimentos"
                  : type === "medications"
                    ? "Medicamentos"
                    : "Otros"}
              </span>
              <div className="flex bg-white rounded-xl p-1 border border-rose-100 w-fit">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => updateAllergies(type, "has", v)}
                    className={`px-5 py-2 rounded-lg text-[9px] font-black transition-all ${
                      formData.medicalHistory.allergies[type].has === v
                        ? "bg-rose-500 text-white"
                        : "text-rose-300"
                    }`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>
            {formData.medicalHistory.allergies[type].has && (
              <input
                type="text"
                placeholder="ESPECIFICA CUÁLES..."
                className="w-full p-4 bg-white border border-rose-200 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-2 ring-rose-100 animate-in slide-in-from-top-2"
                value={formData.medicalHistory.allergies[type].detail}
                onChange={(e) =>
                  updateAllergies(type, "detail", e.target.value)
                }
              />
            )}
          </div>
        ))}
      </div>

      {/* 🌟 NUEVA SECCIÓN: COMORBILIDADES */}
      <div className="bg-amber-50/40 p-6 md:p-8 rounded-modal border border-amber-100/50 space-y-6">
        <h4 className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center gap-2">
          <Warning size={16} weight="fill" /> Comorbilidades (Enfermedades)
        </h4>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <span className="text-[11px] font-black uppercase text-slate-700 italic">
            ¿Tienes alguna enfermedad?
          </span>
          <div className="flex bg-white rounded-xl p-1 border border-amber-100 w-fit">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => updateComorbidities("hasDisease", v)}
                className={`px-5 py-2 rounded-lg text-[9px] font-black transition-all ${
                  formData.medicalHistory.comorbidities.hasDisease === v
                    ? "bg-amber-500 text-white"
                    : "text-amber-400"
                }`}
              >
                {v ? "SÍ" : "NO"}
              </button>
            ))}
          </div>
        </div>

        {/* Si dice que SÍ tiene enfermedades, se abre este bloque */}
        {formData.medicalHistory.comorbidities.hasDisease && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
              Selecciona las que apliquen:
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: "hypertension", label: "PRESIÓN ALTA" },
                { id: "diabetes", label: "DIABETES MELLITUS" },
                { id: "thyroid", label: "PROB. TIROIDES" },
                { id: "kidney", label: "PROB. RIÑONES" },
                { id: "liver", label: "PROB. HÍGADO" },
              ].map((disease) => {
                const isSelected =
                  formData.medicalHistory.comorbidities.diseases[disease.id];
                return (
                  <button
                    key={disease.id}
                    type="button"
                    onClick={() => updateDisease(disease.id, !isSelected)}
                    className={`py-3 px-2 rounded-xl text-[9px] font-black border-2 transition-all ${
                      isSelected
                        ? "bg-amber-100 border-amber-400 text-amber-700"
                        : "bg-white border-amber-100 text-amber-600 hover:bg-amber-50"
                    }`}
                  >
                    {disease.label}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="OTRA, ESPECIFICA..."
              className="w-full p-4 bg-white border border-amber-200 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-2 ring-amber-100 mt-2"
              value={formData.medicalHistory.comorbidities.diseases.others}
              onChange={(e) => updateDisease("others", e.target.value)}
            />

            <div className="pt-4 border-t border-amber-100/50 mt-4">
              <label className="text-[10px] font-black uppercase text-slate-700 italic flex items-center gap-2 mb-3">
                <Pill size={14} weight="fill" className="text-amber-500" /> ¿Qué
                medicamentos tomas para tratar tus enfermedades?
              </label>
              <textarea
                placeholder="ESPECIFICA TUS MEDICAMENTOS ACTUALES..."
                className="w-full p-4 bg-white border border-amber-200 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-2 ring-amber-100 min-h-20"
                value={formData.medicalHistory.comorbidities.currentMedications}
                onChange={(e) =>
                  updateComorbidities("currentMedications", e.target.value)
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentificationSection;
