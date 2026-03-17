"use client";
import { useState, useEffect } from "react";
import {
  IdentificationCard,
  Heartbeat,
  UsersThree,
  GenderFemale,
  Pill,
  CaretRight,
  FloppyDiskBack,
  ActivityIcon,
  ClipboardText, // 🌟 Nuevo icono
} from "@phosphor-icons/react";

import IdentificationSection from "./IdentificationSection";
import SystemsSection from "./SystemsSection";
import FamilyHistorySection from "./FamilyHistorySection";
import GynecoSection from "./GynecoSection";
import PathologicalSection from "./PathologicalSection";
import BackgroundHabitsSection from "./BackgroundHabitsSection";
import CurrentConditionSection from "./CurrentConditionSection"; // 🌟 Importación conectada

const ClinicalForm = ({
  formData,
  setFormData,
  handleSubmit,
  isSubmitting,
}) => {
  const [activeSubStep, setActiveSubStep] = useState("IDENTIFICACION");

  const subSteps = [
    {
      id: "IDENTIFICACION",
      icon: IdentificationCard,
      label: "Datos Personales",
    },
    {
      id: "PADECIMIENTO",
      icon: ClipboardText,
      label: "Motivo de Visita",
    },
    { id: "SISTEMAS", icon: Heartbeat, label: "Revisión Médica" },
    { id: "FAMILIA", icon: UsersThree, label: "Historial Familiar" },
    { id: "GINECO", icon: GenderFemale, label: "Gineco-obstétricos" },
    { id: "PATOLOGICOS", icon: ActivityIcon, label: "Historial Médico" },
    { id: "VIDA", icon: Pill, label: "Estilo de Vida" },
  ];

  // components/patients/NewPatientModal/ClinicalForm.jsx

  useEffect(() => {
    // 🌟 SOLUCIÓN DEFINITIVA:
    // Usamos setTimeout para asegurar que React ya terminó de pintar el nuevo Step
    const timer = setTimeout(() => {
      const modalBody = document.getElementById("modal-scroll-body");
      if (modalBody) {
        // Forzamos el scroll a la posición 0 de tres formas distintas para asegurar compatibilidad
        modalBody.scrollTo({ top: 0, behavior: "instant" });
        modalBody.scrollTop = 0;
      }
    }, 0);

    // Scroll horizontal de las pestañas (Este sí puede ser smooth)
    const activeTabButton = document.getElementById(`tab-${activeSubStep}`);
    if (activeTabButton) {
      activeTabButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }

    return () => clearTimeout(timer); // Limpieza
  }, [activeSubStep]);

  const handleNextSubStep = () => {
    const currentIndex = subSteps.findIndex((s) => s.id === activeSubStep);
    if (currentIndex < subSteps.length - 1) {
      setActiveSubStep(subSteps[currentIndex + 1].id);
    } else {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md py-2 -mx-2 px-2 md:-mx-4 md:px-4">
        <div className="flex justify-between gap-2 p-2 bg-slate-50 rounded-4xl border border-slate-100 overflow-x-auto scrollbar-hide">
          {subSteps.map((s) => {
            const Icon = s.icon;
            const isActive = activeSubStep === s.id;
            return (
              <button
                key={s.id}
                id={`tab-${s.id}`}
                type="button"
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
      </div>

      <div className="min-h-100">
        {/* 🌟 NUEVA SECCIÓN CONECTADA */}
        {activeSubStep === "PADECIMIENTO" && (
          <CurrentConditionSection
            formData={formData}
            setFormData={setFormData}
          />
        )}

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
        {activeSubStep === "PATOLOGICOS" && (
          <PathologicalSection formData={formData} setFormData={setFormData} />
        )}
        {activeSubStep === "VIDA" && (
          <BackgroundHabitsSection
            formData={formData}
            setFormData={setFormData}
          />
        )}
      </div>

      <div className="pt-8 border-t border-slate-100">
        <button
          onClick={handleNextSubStep}
          disabled={isSubmitting}
          className={`w-full py-6 rounded-4xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${
            activeSubStep === "VIDA"
              ? "bg-indigo-900 text-white shadow-indigo-200"
              : "bg-white text-indigo-600 border-2 border-indigo-50 hover:bg-indigo-50 shadow-slate-100"
          }`}
        >
          {isSubmitting ? (
            "Procesando..."
          ) : (
            <>
              {activeSubStep === "VIDA" ? (
                <>
                  Finalizar y Guardar Registro{" "}
                  <FloppyDiskBack size={20} weight="fill" />
                </>
              ) : (
                <>
                  Siguiente Categoría <CaretRight size={20} weight="bold" />
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ClinicalForm;
