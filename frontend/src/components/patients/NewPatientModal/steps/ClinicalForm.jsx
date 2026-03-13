"use client";
import { useState } from "react";
import {
  IdentificationCard,
  Heartbeat,
  UsersThree,
  GenderFemale,
  Pill,
} from "@phosphor-icons/react";

// Importación de las sub-secciones (Asegúrate que los nombres de archivos coincidan)
import IdentificationSection from "./IdentificationSection"
import SystemsSection from "./SystemsSection"; // Lo movimos a su propio archivo por orden
import FamilyHistorySection from "./FamilyHistorySection";
import GynecoSection from "./GynecoSection";
import BackgroundHabitsSection from "./BackgroundHabitsSection";

const ClinicalForm = ({ formData, setFormData }) => {
  const [activeSubStep, setActiveSubStep] = useState("IDENTIFICACION");

  // Navegación interna con los iconos y etiquetas de Sbeltic
  const subSteps = [
    { id: "IDENTIFICACION", icon: IdentificationCard, label: "Ficha" },
    { id: "SISTEMAS", icon: Heartbeat, label: "Sistemas" },
    { id: "FAMILIA", icon: UsersThree, label: "Familia" },
    { id: "GINECO", icon: GenderFemale, label: "Mujer" },
    { id: "VIDA", icon: Pill, label: "Vida / Hábitos" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* MENÚ DE SUB-PESTAÑAS */}
      <div className="flex justify-between gap-2 p-2 bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-x-auto scrollbar-hide">
        {subSteps.map((s) => {
          const Icon = s.icon;
          const isActive = activeSubStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSubStep(s.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white text-indigo-600 shadow-md ring-1 ring-slate-100"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={18} weight={isActive ? "fill" : "bold"} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* RENDERIZADO CONDICIONAL DE CADA BLOQUE DEL CUESTIONARIO */}
      <div className="min-h-112.5">
        {activeSubStep === "IDENTIFICACION" && (
          <IdentificationSection
            formData={formData}
            setFormData={setFormData}
          />
        )}

        {activeSubStep === "SISTEMAS" && (
          <SystemsSection formData={formData} setFormData={setFormData} />
        )}

        {activeSubStep === "FAMILIA" && (
          <FamilyHistorySection formData={formData} setFormData={setFormData} />
        )}

        {activeSubStep === "GINECO" && (
          <GynecoSection formData={formData} setFormData={setFormData} />
        )}

        {activeSubStep === "VIDA" && (
          <BackgroundHabitsSection
            formData={formData}
            setFormData={setFormData}
          />
        )}
      </div>
    </div>
  );
};

export default ClinicalForm;
