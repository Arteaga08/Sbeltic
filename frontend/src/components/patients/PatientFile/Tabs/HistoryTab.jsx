"use client";
import { useState, useEffect } from "react";
import {
  FloppyDiskBack,
  LockSimple,
  PencilLine,
  Tag,
  FilePdf,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PDFDownloadLink } from "@react-pdf/renderer";
import MedicalHistoryPDF from "./MedicalHistoryPDF";

// Importaciones
import BasicInfoForm from "../../NewPatientModal/steps/BasicInfoForm";
import IdentificationSection from "../../NewPatientModal/steps/IdentificationSection";
import FamilyHistorySection from "../../NewPatientModal/steps/FamilyHistorySection";
import PathologicalSection from "../../NewPatientModal/steps/PathologicalSection";
import BackgroundHabitsSection from "../../NewPatientModal/steps/BackgroundHabitsSection";
import GynecoSection from "../../NewPatientModal/steps/GynecoSection";
import SystemsSection from "../../NewPatientModal/steps/SystemsSection";
import CurrentConditionSection from "../../NewPatientModal/steps/CurrentConditionSection";
import WhatsAppSignatureButton from "../../shared/WhatsAppSignatureButton"; // 🌟 IMPORTACIÓN DEL BOTÓN

const HistoryTab = ({ patient, userRole, onUpdate, onClose }) => {
  const [formData, setFormData] = useState(patient || {});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patient) setFormData(patient);
  }, [patient]);

  const canEdit = userRole === "DOCTOR";

  if (!patient || !formData._id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
          Sincronizando...
        </p>
      </div>
    );
  }

  const categories = [
    {
      id: "SPA",
      label: "Spa",
      color: "bg-blue-500",
      shadow: "shadow-blue-100",
    },
    {
      id: "INJECTION",
      label: "Inyectables",
      color: "bg-purple-500",
      shadow: "shadow-purple-100",
    },
    {
      id: "SURGERY",
      label: "Cirugía",
      color: "bg-rose-500",
      shadow: "shadow-rose-100",
    },
    {
      id: "POST_OP",
      label: "Post-Op",
      color: "bg-emerald-500",
      shadow: "shadow-emerald-100",
    },
    {
      id: "LEAD",
      label: "Seguimiento",
      color: "bg-amber-500",
      shadow: "shadow-amber-100",
    },
    {
      id: "OTHER",
      label: "Otro",
      color: "bg-slate-500",
      shadow: "shadow-slate-100",
    },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const {
        _id,
        __v,
        createdAt,
        updatedAt,
        createdBy,
        walletCoupons,
        clinicalNotes,
        evolutions,
        ...cleanData
      } = formData;

      if (
        cleanData.medicalHistory &&
        typeof cleanData.medicalHistory.currentCondition === "object"
      ) {
        cleanData.medicalHistory.currentCondition =
          cleanData.medicalHistory.currentCondition.reason || "";
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patient._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(cleanData),
        },
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Expediente actualizado correctamente");
        setIsEditing(false);
        onUpdate();
        setTimeout(() => onClose(), 600);
      } else {
        toast.error(data.message || "Error al actualizar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* BARRA DE ACCIONES STICKY */}
      <div className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${canEdit ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"}`}
          >
            {canEdit ? (
              <PencilLine size={20} weight="bold" />
            ) : (
              <LockSimple size={20} weight="bold" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest leading-none mb-1">
              {isEditing ? "Modo Edición" : "Modo Lectura"}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {canEdit ? "Permisos activos" : "Solo consulta"}
            </p>
          </div>
        </div>

        {/* 🌟 CONTENEDOR DE BOTONES (PDF + Firma + Guardar) */}
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
          <PDFDownloadLink
            document={<MedicalHistoryPDF patient={formData} />}
            fileName={`Historial_Medico_${(formData.name || "Paciente").replace(/\s+/g, "_")}.pdf`}
          >
            {({ loading }) => (
              <button
                disabled={loading}
                className="shrink-0 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg bg-slate-800 text-white shadow-slate-100 disabled:opacity-50 whitespace-nowrap"
                title="Descargar Historial Médico PDF"
              >
                <FilePdf size={16} weight="bold" />
                {loading ? "Generando..." : "Historial PDF"}
              </button>
            )}
          </PDFDownloadLink>

          {!isEditing && (
            <WhatsAppSignatureButton
              patientPhone={formData.phone}
              patientName={formData.name}
              patientId={formData._id}
              type="HISTORY"
            />
          )}

          {canEdit && (
            <button
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={isSaving}
              className={`shrink-0 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${
                isEditing
                  ? "bg-emerald-500 text-white shadow-emerald-100"
                  : "bg-indigo-600 text-white shadow-indigo-100"
              }`}
            >
              {isSaving ? (
                "Cargando..."
              ) : isEditing ? (
                <>
                  <FloppyDiskBack size={18} weight="bold" /> Guardar
                </>
              ) : (
                "Editar Datos"
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className={`${!isEditing ? "pointer-events-none opacity-90" : "pointer-events-auto"} space-y-12`}
      >
        {/* ... Resto del componente original de Categorías y Secciones ... */}
        <section className="bg-slate-50/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100">
          <header className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm">
              <Tag size={20} weight="fill" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase text-slate-800 tracking-widest leading-none italic">
                Categoría Médica
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Estatus del paciente en clínica
              </p>
            </div>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.map((type) => {
              const isActive = formData.patientType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, patientType: type.id })
                  }
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 border-2 gap-2 ${isActive ? `${type.color} border-transparent text-white shadow-xl ${type.shadow} scale-105 z-10` : "bg-white border-slate-100 text-slate-400 hover:border-indigo-100"}`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-white animate-pulse" : type.color}`}
                  />
                  <span className="text-[9px] font-black uppercase tracking-tighter">
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="max-w-4xl mx-auto space-y-12">
          <BasicInfoForm formData={formData} setFormData={setFormData} />
          <div className="border-t border-slate-100 pt-10">
            <IdentificationSection
              formData={formData}
              setFormData={setFormData}
            />
          </div>
          <div className="border-t border-slate-100 pt-10">
            <FamilyHistorySection
              formData={formData}
              setFormData={setFormData}
            />
          </div>
          <div className="border-t border-slate-100 pt-10">
            <PathologicalSection
              formData={formData}
              setFormData={setFormData}
            />
          </div>
          <div className="border-t border-slate-100 pt-10">
            <BackgroundHabitsSection
              formData={formData}
              setFormData={setFormData}
            />
          </div>
          <div className="border-t border-slate-100 pt-10">
            <GynecoSection formData={formData} setFormData={setFormData} />
          </div>
          <div className="border-t border-slate-100 pt-10">
            <SystemsSection formData={formData} setFormData={setFormData} />
          </div>
          <div className="border-t border-slate-100 pt-10">
            <CurrentConditionSection
              formData={formData}
              setFormData={setFormData}
            />
          </div>
        </section>
      </div>
    </div>
  );
};

export default HistoryTab;
