"use client";
import { UsersThree, WarningCircle } from "@phosphor-icons/react";

const FamilyHistorySection = ({ formData, setFormData }) => {
  const updateFamily = (id, field, value) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        family: {
          ...formData.medicalHistory.family,
          [id]: { ...formData.medicalHistory.family[id], [field]: value },
        },
      },
    });
  };

  const conditions = [
    { id: "hypertension", label: "Hipertensión Arterial" },
    { id: "diabetes", label: "Diabetes Mellitus" },
    { id: "thrombosis", label: "Trombosis" },
    { id: "bleeding", label: "Sangrados Exagerados" },
    { id: "cancer", label: "Cáncer" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="p-4 bg-amber-50 rounded-2xl border border-amber-100 mb-6">
        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest text-center">
          Antecedentes de padres, abuelos o hermanos
        </p>
      </header>

      {conditions.map((item) => (
        <div
          key={item.id}
          className={`p-6 rounded-4xl border transition-all ${formData.medicalHistory.family?.[item.id]?.has ? "bg-indigo-50/30 border-indigo-200" : "bg-white border-slate-100"}`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <span className="text-xs font-black uppercase text-slate-800 italic">
              {item.label}
            </span>

            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              {[true, false, "DESCONOZCO"].map((v) => (
                <button
                  key={String(v)}
                  onClick={() => updateFamily(item.id, "has", v)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${formData.medicalHistory.family?.[item.id]?.has === v ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}
                >
                  {v === true ? "SÍ" : v === false ? "NO" : "NS/NC"}
                </button>
              ))}
            </div>
          </div>

          {formData.medicalHistory.family?.[item.id]?.has === true && (
            <div className="mt-4 flex flex-col gap-3 animate-in slide-in-from-top-2">
              <input
                type="text"
                placeholder="¿QUIÉN(ES)? EJ. ABUELA PATERNA"
                className="w-full p-4 bg-white border border-indigo-100 rounded-2xl font-bold text-[10px] uppercase outline-none focus:ring-2 ring-indigo-50"
                value={formData.medicalHistory.family[item.id].who || ""}
                onChange={(e) => updateFamily(item.id, "who", e.target.value)}
              />
              {item.id === "cancer" && (
                <input
                  type="text"
                  placeholder="¿DE QUÉ TIPO?"
                  className="w-full p-4 bg-white border border-rose-100 rounded-2xl font-bold text-[10px] uppercase outline-none"
                  onChange={(e) =>
                    updateFamily(item.id, "type", e.target.value)
                  }
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FamilyHistorySection;
