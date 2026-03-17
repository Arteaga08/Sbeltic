"use client";
// 🌟 Cambiamos 'Activity' por 'Pulse'
import {
  Heartbeat,
  Pulse,
  Waves,
  Wind,
  Flask,
  Drop,
  WarningCircle,
  Brain,
} from "@phosphor-icons/react";

const SystemsSection = ({ formData, setFormData }) => {
  const updateSystem = (id, hasIssue) => {
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        systems: {
          ...formData.medicalHistory.systems,
          [id]: { ...formData.medicalHistory.systems[id], hasIssue },
        },
      },
    });
  };

  const systems = [
    { id: "heart", label: "Corazón", icon: Heartbeat },
    { id: "circulation", label: "Circulación Sanguínea", icon: Pulse },
    { id: "coagulation", label: "Coagulación de Sangre", icon: Waves },
    { id: "respiratory", label: "Pulmones / Respiración", icon: Wind },
    { id: "gastrointestinal", label: "Gastrointestinales", icon: Flask },
    { id: "urinary", label: "Vías Urinarias", icon: WarningCircle },
    { id: "hormonal", label: "Sistema Hormonal", icon: Drop },
    { id: "skin", label: "Piel", icon: Pulse },
    { id: "nervous", label: "Sistema Nervioso", icon: Brain },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      
      {/* 🌟 NUEVO TÍTULO AÑADIDO AQUÍ */}
      <div className="bg-slate-50 p-5 rounded-4xl mb-2 text-center border border-slate-100">
        <p className="text-[10px] md:text-xs font-black text-slate-600 uppercase tracking-widest italic leading-relaxed">
          Aparte de las enfermedades que mencionaste <span className="text-[9px] text-slate-400 normal-case tracking-normal">(si es que tienes alguna)</span>
          <br className="hidden md:block" />
          <span className="text-indigo-600">¿Tienes algún problema en?</span>
        </p>
      </div>

      {systems.map((sys) => {
        // Acceso seguro a la data
        const systemData = formData.medicalHistory?.systems?.[sys.id] || {
          hasIssue: false,
          detail: "",
        };
        const hasIssue = systemData.hasIssue;

        return (
          <div
            key={sys.id}
            className={`p-6 border rounded-4xl transition-all ${hasIssue ? "bg-amber-50 border-amber-200" : "bg-white border-slate-100"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${hasIssue ? "bg-amber-100 text-amber-600" : "bg-slate-50 text-slate-400"}`}
                >
                  <sys.icon size={20} weight="bold" />
                </div>
                <span className="text-xs font-black uppercase text-slate-800 italic">
                  {sys.label}
                </span>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => updateSystem(sys.id, v)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${hasIssue === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                  >
                    {v ? "SÍ" : "NO"}
                  </button>
                ))}
              </div>
            </div>

            {hasIssue && (
              <input
                type="text"
                placeholder="¿DE QUÉ TIPO O DETALLES?"
                className="w-full px-5 py-4 bg-white border border-amber-200 rounded-2xl text-[10px] uppercase font-bold outline-none focus:ring-2 ring-amber-100 animate-in zoom-in-95"
                value={systemData.detail}
                onChange={(e) => {
                  const newSystems = { ...formData.medicalHistory.systems };
                  newSystems[sys.id].detail = e.target.value;
                  setFormData({
                    ...formData,
                    medicalHistory: {
                      ...formData.medicalHistory,
                      systems: newSystems,
                    },
                  });
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SystemsSection;