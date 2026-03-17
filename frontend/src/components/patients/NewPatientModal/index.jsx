"use client";
import { useState, useEffect, useCallback } from "react";
import { X, CaretLeft, CaretRight, CheckCircle } from "@phosphor-icons/react"; // 🌟 Importamos CheckCircle
import { toast } from "sonner";

import TypeSelector from "./steps/TypeSelector";
import BasicInfoForm from "./steps/BasicInfoForm";
import ClinicalForm from "./steps/ClinicalForm";
import WhatsAppSignatureButton from "../shared/WhatsAppSignatureButton";

const INITIAL_STATE = {
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
    family: {
      hypertension: { has: false, who: "" },
      diabetes: { has: false, who: "" },
      thrombosis: { has: false, who: "" },
      bleeding: { has: false, who: "" },
      cancer: { has: false, who: "", type: "" },
    },
    gyneco: {
      menarcheAge: "",
      pregnancies: "",
      naturalBirths: "",
      lastBirthDate: "",
      cSections: "",
      lastCSectionDate: "",
      abortions: "",
      lastAbortionDate: "",
      hasComplications: false,
      complicationsDetail: "",
      lastMenstruationDate: "",
      cycleDurationDays: "",
      bleedingDays: "",
      isIrregular: false,
      contraceptiveMethod: "",
      otherContraceptive: "",
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
        types: { marijuana: false, cocaine: false, crystal: false, other: "" },
        frequency: "",
        lastTime: "",
      },
      exercise: { does: false, type: "" },
      supplements: { does: false, detail: "" },
      previousTreatments: {
        massages: false,
        mesotherapy: false,
        fillers: false,
        others: "",
      },
    },
    currentCondition: "",
  },
};

const NewPatientModal = ({ isOpen, onClose, onRefresh }) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_STATE);

  // 🌟 ESTADO NUEVO PARA PANTALLA DE ÉXITO
  const [createdPatient, setCreatedPatient] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setFormData(INITIAL_STATE);
      setCreatedPatient(null); // Limpiamos la pantalla de éxito al cerrar
    }
  }, [isOpen]);

  const isDeepProfile = ["SURGERY", "INJECTION", "LEAD", "POST_OP"].includes(
    formData.patientType,
  );

  const isStepValid = useCallback(() => {
    if (step === 1) {
      const nameParts = formData.name.trim().split(" ");
      const isPhoneValid = formData.phone.replace(/\D/g, "").length >= 10;
      return nameParts.length >= 2 && isPhoneValid;
    }
    return true;
  }, [step, formData]);

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
        onRefresh();

        // 🌟 En lugar de cerrar el modal directo, mostramos la pantalla de éxito
        setCreatedPatient(data.data);
      } else {
        toast.error(data.message || "Error al registrar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // 🌟 PANTALLA DE ÉXITO (Se muestra solo cuando ya tenemos al paciente creado)
  if (createdPatient) {
    return (
      <div className="fixed inset-0 z-10000 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md bg-white rounded-[3.5rem] shadow-2xl p-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center shadow-inner mb-6">
            <CheckCircle size={50} weight="fill" />
          </div>

          <h3 className="text-2xl font-black uppercase italic text-slate-900 leading-none">
            ¡Registro Exitoso!
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-8">
            El paciente {createdPatient.name} ha sido guardado. Se envió un
            mensaje automático de bienvenida.
          </p>

          <div className="w-full mb-6">
            <WhatsAppSignatureButton
              patientPhone={createdPatient.phone}
              patientName={createdPatient.name}
              patientId={createdPatient._id}
              type="HISTORY"
            />
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Cerrar y Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // FLUJO NORMAL DEL FORMULARIO
  return (
    <div className="fixed inset-0 z-10000 flex items-start justify-center p-4 pt-12 md:items-center md:pt-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[90vh] animate-in slide-in-from-top-4 duration-300">
        <header className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 rounded-xl"
              >
                <CaretLeft size={24} weight="bold" />
              </button>
            )}
            <h2 className="text-2xl md:text-3xl font-black italic uppercase text-slate-900 leading-none">
              {step === 0
                ? "Categoría"
                : step === 1
                  ? "Información"
                  : "Clínica"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 md:p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-rose-500"
          >
            <X size={20} weight="bold" />
          </button>
        </header>

        {/* 🌟 CONTENEDOR CON ID PARA EL SCROLL FIX */}
        <div
          id="modal-scroll-body"
          className="p-6 md:p-8 overflow-y-auto scrollbar-hide flex-1 scroll-smooth"
        >
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
            <ClinicalForm
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {step === 1 && (
          <div className="p-6 md:p-8 bg-slate-50/80 border-t border-slate-100 flex justify-end">
            <button
              onClick={isDeepProfile ? () => setStep(2) : handleSubmit}
              disabled={isSubmitting || !isStepValid()}
              className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl transition-all ${!isStepValid() ? "bg-slate-100 text-slate-300" : "bg-indigo-600 text-white shadow-indigo-200"}`}
            >
              {isSubmitting
                ? "Registrando..."
                : isDeepProfile
                  ? "Ir a Clínica"
                  : "Finalizar Registro"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewPatientModal;
