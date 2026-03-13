"use client";
import { useState } from "react";
import {
  X,
  CaretLeft,
  CaretRight,
  CheckCircle,
  FloppyDiskBack,
} from "@phosphor-icons/react";
import { toast } from "sonner";

// Importación de Pasos
import TypeSelector from "./steps/TypeSelector";
import BasicInfoForm from "./steps/BasicInfoForm";
import ClinicalForm from "./steps/ClinicalForm";

const NewPatientModal = ({ isOpen, onClose, onRefresh }) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado inicial alineado a tu modelo de Mongoose
  const [formData, setFormData] = useState({
    patientType: "SPA",
    name: "",
    phone: "",
    email: "",
    allowsWhatsAppNotifications: true,
    medicalHistory: {
      identification: {
        age: "",
        birthday: "",
        address: "",
        occupation: "",
        educationLevel: "CARRERA",
        ethnicGroup: "MESTIZO",
        religion: "CATOLICO",
        vaccines: { complete: true, missing: "" },
      },
      allergies: {
        food: { has: false, detail: "" },
        medications: { has: false, detail: "" },
        others: { has: false, detail: "" },
      },
      vital: { bloodType: "DESCONOCIDO" },
      comorbidities: {
        hasDisease: false,
        diseases: {
          hypertension: false,
          diabetes: false,
          thyroid: false,
          kidney: false,
          liver: false,
          others: "",
        },
        currentMedications: "",
      },
      systems: {
        heart: { hasIssue: false, detail: "" },
        circulation: { hasIssue: false, detail: "" },
        coagulation: { hasIssue: false, detail: "" },
        respiratory: { hasIssue: false, detail: "" },
        gastrointestinal: { hasIssue: false, detail: "" },
        urinary: { hasIssue: false, detail: "" },
        hormonal: { hasIssue: false, detail: "" },
        skin: { hasIssue: false, detail: "" },
        nervous: { hasIssue: false, detail: "" },
      },
      pathological: {
        surgeries: { has: false, detail: "", dates: "", complications: "" },
        hospitalized: { has: false, reason: "", date: "" },
        accidents: { has: false, detail: "", sequels: "", date: "" },
        malformations: { has: false, detail: "" },
        transfusions: { has: false, reaction: "" },
        covid: {
          had: false,
          date: "",
          sequels: "",
          vaccine: false,
          type: "",
          doses: "",
        },
      },
      habits: {
        tobacco: { does: false, frequency: "", lastTime: "" },
        alcohol: { does: false, frequency: "", lastTime: "" },
        drugs: {
          does: false,
          types: {
            marijuana: false,
            cocaine: false,
            crystal: false,
            other: "",
          },
          frequency: "",
          lastTime: "",
        },
        exercise: { does: false, type: "" },
        supplements: { does: false, detail: "" },
        previousTreatments: {
          massages: false,
          mesotherapy: false,
          cavitation: false,
          hydrolipoclasy: false,
          cryolipolysis: false,
          radiofrequency: false,
          fillers: false,
          others: "",
        },
      },
      currentCondition: { reason: "" },
    },
  });

  if (!isOpen) return null;

  // LÓGICA DE FLUJO: Define si necesitamos el paso médico
  const isDeepProfile = ["SURGERY", "INJECTION", "LEAD", "POST_OP"].includes(
    formData.patientType,
  );

  const handleNext = () => {
    // Si es SPA u OTHER y estamos en el paso 1, ya podemos guardar
    if (!isDeepProfile && step === 1) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Paciente registrado con éxito");
        onRefresh(); // Recarga la lista del directorio
        onClose(); // Cierra el modal
        setStep(0); // Resetea el flujo
      } else {
        toast.error(data.message || "Error al registrar");
      }
    } catch (error) {
      toast.error("Error de conexión con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER CON INDICADOR DE PROGRESO */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {[0, 1, 2].map(
                (i) =>
                  // Solo mostramos el punto 2 si el perfil es profundo
                  (i < 2 || isDeepProfile) && (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${step === i ? "w-6 bg-indigo-600" : "w-2 bg-slate-200"}`}
                    />
                  ),
              )}
            </div>
            <h2 className="text-3xl font-black italic uppercase text-slate-900 leading-none">
              {step === 0
                ? "Categoría"
                : step === 1
                  ? "Información"
                  : "Clínica"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-500 transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* CUERPO DINÁMICO */}
        <div className="p-8 overflow-y-auto scrollbar-hide flex-1">
          {step === 0 && (
            <TypeSelector
              selected={formData.patientType}
              onSelect={(type) => {
                setFormData({ ...formData, patientType: type });
                setStep(1);
              }}
            />
          )}

          {step === 1 && (
            <BasicInfoForm formData={formData} setFormData={setFormData} />
          )}

          {step === 2 && isDeepProfile && (
            <ClinicalForm formData={formData} setFormData={setFormData} />
          )}
        </div>

        {/* FOOTER DE NAVEGACIÓN */}
        {step > 0 && (
          <div className="p-8 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all"
            >
              <CaretLeft size={16} weight="bold" /> Volver
            </button>

            <button
              onClick={
                step === 2 || (step === 1 && !isDeepProfile)
                  ? handleSubmit
                  : handleNext
              }
              disabled={isSubmitting}
              className={`px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all flex items-center gap-3 active:scale-95 ${
                isSubmitting
                  ? "bg-slate-200 text-slate-400"
                  : "bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? (
                "Registrando..."
              ) : (
                <>
                  {step === 2 || (step === 1 && !isDeepProfile) ? (
                    <>
                      <FloppyDiskBack size={20} weight="bold" /> Finalizar
                      Registro
                    </>
                  ) : (
                    <>
                      Siguiente Paso <CaretRight size={20} weight="bold" />
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPatientModal;
