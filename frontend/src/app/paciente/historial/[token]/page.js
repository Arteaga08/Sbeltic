"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  WarningCircle,
  ArrowRight,
} from "@phosphor-icons/react";

import IdentificationSection from "@/components/patients/NewPatientModal/steps/IdentificationSection";
import FamilyHistorySection from "@/components/patients/NewPatientModal/steps/FamilyHistorySection";
import PathologicalSection from "@/components/patients/NewPatientModal/steps/PathologicalSection";
import BackgroundHabitsSection from "@/components/patients/NewPatientModal/steps/BackgroundHabitsSection";
import GynecoSection from "@/components/patients/NewPatientModal/steps/GynecoSection";
import SystemsSection from "@/components/patients/NewPatientModal/steps/SystemsSection";
import CurrentConditionSection from "@/components/patients/NewPatientModal/steps/CurrentConditionSection";
import SignaturePad from "@/components/patients/PatientFile/SignaturePad";

const INITIAL_FORM_DATA = {
  medicalHistory: {
    identification: {
      age: "",
      birthday: "",
      address: "",
      educationLevel: "BACHILLERATO",
      religion: "CATOLICO",
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
      hypertension: { has: false },
      diabetes: { has: false },
      thrombosis: { has: false },
      bleeding: { has: false },
      cancer: { has: false },
    },
    gyneco: {},
    systems: {},
    pathological: {
      surgeries: { has: false, detail: "", dates: "", complications: "" },
      hospitalized: { has: false, reason: "", date: "" },
      accidents: { has: false, detail: "", sequels: "", date: "" },
      malformations: { has: false, detail: "" },
      transfusions: { has: false, reaction: "" },
      covid: { had: false, date: "", sequels: "", vaccine: false, type: "", doses: "" },
    },
    habits: {
      tobacco: { does: false, frequency: "", lastTime: "" },
      alcohol: { does: false, frequency: "", lastTime: "" },
      drugs: { does: false, types: { marijuana: false, cocaine: false, crystal: false, other: "" }, frequency: "", lastTime: "" },
      exercise: { does: false, type: "" },
      supplements: { does: false, detail: "" },
      previousTreatments: { massages: false, mesotherapy: false, fillers: false, others: "" },
    },
    currentCondition: {},
  },
};

const SECTIONS = [
  { id: "identification", label: "Identificación y Alergias" },
  { id: "family", label: "Antecedentes Familiares" },
  { id: "pathological", label: "Antecedentes Patológicos" },
  { id: "habits", label: "Hábitos y Estilos de Vida" },
  { id: "gyneco", label: "Antecedentes Ginecológicos" },
  { id: "systems", label: "Revisión de Sistemas" },
  { id: "currentCondition", label: "Motivo de Consulta" },
  { id: "signature", label: "Firma Digital" },
];

export default function MedicalHistoryPublicPage() {
  const params = useParams();
  const token = params?.token;

  const [status, setStatus] = useState("loading"); // loading | valid | expired | used | submitted
  const [patientName, setPatientName] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [signature, setSignature] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    const validate = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/medical-history/validate/${token}`,
        );
        const result = await res.json();

        if (result.success) {
          setPatientName(result.data.patientName);
          setStatus("valid");
        } else {
          setStatus(result.reason === "used" ? "used" : "expired");
        }
      } catch {
        setStatus("expired");
      }
    };
    validate();
  }, [token]);

  const handleSubmit = async () => {
    if (!signature) {
      toast.error("Por favor, añade tu firma antes de enviar.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/medical-history/submit/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            medicalHistory: formData.medicalHistory,
            historySignature: signature,
          }),
        },
      );

      const result = await res.json();
      if (result.success) {
        setStatus("submitted");
      } else {
        toast.error(result.message || "Error al guardar el historial.");
      }
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Scroll to top on section change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentSection]);

  // Section validation
  const validateSection = (index) => {
    const mh = formData.medicalHistory;
    switch (index) {
      case 0: // Identificación
        return !!(mh.identification.age && mh.identification.birthday && mh.identification.address);
      case 1: // Family History — all conditions must have explicit selection
        return ["hypertension", "diabetes", "thrombosis", "bleeding", "cancer"].every(
          (id) => mh.family?.[id]?.has !== undefined
        );
      case 2: // Patológicos — all toggles answered (they have defaults so always true)
        return true;
      case 3: // Hábitos — all toggles answered (they have defaults so always true)
        return true;
      case 4: // Ginecología — siempre válida (opcional, solo mujeres)
        return true;
      case 5: // Sistemas — all toggles answered (they have defaults so always true)
        return true;
      case 6: // Motivo de consulta
        return typeof mh.currentCondition === "string" && mh.currentCondition.trim().length > 0;
      default:
        return true;
    }
  };

  const isSectionValid = validateSection(currentSection);

  const handleNext = () => {
    if (!isSectionValid) {
      toast.error("Por favor, completa todos los campos antes de continuar.");
      return;
    }
    setCurrentSection((s) => s + 1);
  };

  const isLastSection = currentSection === SECTIONS.length - 1;

  // ── PANTALLAS DE ESTADO ────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <p className="font-black italic uppercase text-slate-400 text-sm animate-pulse">
          Sbeltic Secure Link...
        </p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50">
        <Clock
          size={72}
          weight="fill"
          className="text-amber-400 mb-4 animate-in zoom-in duration-500"
        />
        <h1 className="text-lg font-black uppercase text-slate-900">
          Enlace Expirado
        </h1>
        <p className="text-xs font-bold text-slate-400 mt-3 max-w-xs leading-relaxed">
          Este enlace ha expirado por tu seguridad. Por favor, solicita uno
          nuevo por WhatsApp.
        </p>
      </div>
    );
  }

  if (status === "used") {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50">
        <CheckCircle
          size={72}
          weight="fill"
          className="text-emerald-400 mb-4 animate-in zoom-in duration-500"
        />
        <h1 className="text-lg font-black uppercase text-slate-900">
          Formulario Completado
        </h1>
        <p className="text-xs font-bold text-slate-400 mt-3 max-w-xs leading-relaxed">
          Tu historial médico ya fue registrado. Gracias por tu tiempo.
        </p>
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50">
        <CheckCircle
          size={80}
          weight="fill"
          className="text-emerald-500 mb-4 animate-in zoom-in duration-500"
        />
        <h1 className="text-xl font-black uppercase text-slate-900">
          ¡Historial Guardado!
        </h1>
        <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest max-w-xs">
          Tu historial médico se registró correctamente.
          <br />
          Ya puedes cerrar esta ventana, {patientName?.split(" ")[0]}.
        </p>
      </div>
    );
  }

  // ── FORMULARIO PRINCIPAL ───────────────────────────────────────────────────

  const section = SECTIONS[currentSection];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em]">
            Sbeltic — Historial Médico
          </p>
          <p className="text-sm font-black italic text-slate-800 uppercase">
            {patientName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            Paso
          </p>
          <p className="text-lg font-black text-indigo-600">
            {currentSection + 1}
            <span className="text-slate-300 text-sm">/{SECTIONS.length}</span>
          </p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-indigo-500 transition-all duration-500"
          style={{
            width: `${((currentSection + 1) / SECTIONS.length) * 100}%`,
          }}
        />
      </div>

      {/* Section title */}
      <div className="px-4 pt-6 pb-2">
        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
          {section.label}
        </p>
      </div>

      {/* Form content */}
      <div className="flex-1 px-4 pb-32 overflow-y-auto">
        {currentSection === 0 && (
          <IdentificationSection
            formData={formData}
            setFormData={setFormData}
          />
        )}
        {currentSection === 1 && (
          <FamilyHistorySection
            formData={formData}
            setFormData={setFormData}
          />
        )}
        {currentSection === 2 && (
          <PathologicalSection
            formData={formData}
            setFormData={setFormData}
          />
        )}
        {currentSection === 3 && (
          <BackgroundHabitsSection
            formData={formData}
            setFormData={setFormData}
          />
        )}
        {currentSection === 4 && (
          <GynecoSection formData={formData} setFormData={setFormData} />
        )}
        {currentSection === 5 && (
          <SystemsSection formData={formData} setFormData={setFormData} />
        )}
        {currentSection === 6 && (
          <CurrentConditionSection
            formData={formData}
            setFormData={setFormData}
          />
        )}
        {currentSection === 7 && (
          <div className="space-y-6 py-4">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-[10px] text-slate-500 leading-relaxed font-medium">
              Al firmar este documento, confirmo que la información proporcionada
              en este historial médico es verídica y completa. Autorizo a Sbeltic
              a utilizar estos datos exclusivamente para fines de atención médica,
              conforme a la NOM-004-SSA3-2012.
            </div>
            <SignaturePad
              label="Firma del Paciente"
              onSave={(base64) => setSignature(base64)}
              existingSignature={signature}
            />
            {signature && (
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest text-center animate-in fade-in">
                ✓ Firma capturada — ya puedes enviar tu historial
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4">
        <div className="flex gap-3 md:max-w-md md:mx-auto">
          {currentSection > 0 && (
            <button
              onClick={() => setCurrentSection((s) => s - 1)}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest"
            >
              Atrás
            </button>
          )}

          {!isLastSection ? (
            <button
              onClick={handleNext}
              disabled={!isSectionValid}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Siguiente <ArrowRight size={16} weight="bold" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !signature}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {submitting ? "Guardando..." : "Enviar Historial Médico"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
