"use client";
import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlass, Plus, CaretLeft, Pill } from "@phosphor-icons/react";
import { toast } from "sonner";
import PatientStats from "@/components/patients/PatientStats";
import PatientCard from "@/components/patients/PatientCard";
import NewPatientModal from "@/components/patients/NewPatientModal";

import PatientFileModal from "@/components/patients/PatientFile";
import TreatmentManagerModal from "@/components/patients/TreatmentManagerModal";

const categoryNames = {
  ALL: "Directorio",
  SPA: "Spa / Retail",
  INJECTION: "Inyectables",
  LEAD: "Cotización",
  SURGERY: "Cirugía",
  POST_OP: "Post-Op",
  OTHER: "Otros",
};

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("DASHBOARD");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // 🌟 ESTADOS PARA MODALES
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients?limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      const data = await res.json();
      if (data.success) {
        setPatients(data.data.patients || data.data || []);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const counts = useMemo(() => {
    const c = {};
    patients.forEach((p) => {
      c[p.patientType] = (c[p.patientType] || 0) + 1;
    });
    return c;
  }, [patients]);

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const safeName = p.name || "";
      const safePhone = p.phone || "";
      const matchesSearch =
        safeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        safePhone.includes(searchTerm);
      const matchesCategory =
        selectedCategory === "ALL" || p.patientType === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [patients, searchTerm, selectedCategory]);

  // 🌟 FUNCIÓN PARA ABRIR EXPEDIENTE
  const handleOpenFolder = (patientId) => {
    setSelectedPatientId(patientId);
    setIsFileModalOpen(true);
  };

  return (
    <div className="space-y-10 p-4 md:p-8 pb-32 md:pb-8 max-w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="space-y-2 text-center md:text-left">
          {currentView === "LIST" && (
            <button
              onClick={() => setCurrentView("DASHBOARD")}
              className="flex items-center justify-start gap-2 text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-4 hover:gap-3 transition-all"
            >
              <CaretLeft size={14} weight="bold" /> Volver al Directorio
            </button>
          )}
          <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase text-slate-900 leading-none">
            {currentView === "DASHBOARD"
              ? "Directorio"
              : categoryNames[selectedCategory]}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-label">
            {currentView === "DASHBOARD"
              ? "Gestión de Pacientes Sbeltic"
              : `Estructura organizacional Sbeltic`}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsTreatmentModalOpen(true)}
            className="w-full md:w-auto px-6 py-4 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
          >
            <Pill size={16} weight="bold" /> Tratamientos
          </button>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
          >
            <Plus size={18} weight="bold" /> NUEVO REGISTRO
          </button>
        </div>
      </header>

      {currentView === "DASHBOARD" ? (
        <PatientStats
          counts={counts}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentView("LIST");
          }}
        />
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="relative max-w-xl mb-10 group mx-auto md:mx-0">
            <MagnifyingGlass
              size={20}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
            />
            <input
              type="text"
              placeholder={`BUSCAR EN ${categoryNames[selectedCategory].toUpperCase()}...`}
              className="w-full pl-14 pr-8 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600/20 transition-all font-bold text-[10px] uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-modal border-2 border-dashed border-slate-100 mt-6 col-span-full">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  No hay pacientes en {categoryNames[selectedCategory]}
                </p>
              </div>
            ) : (
              filteredPatients.map((patient, index) => (
                <PatientCard
                  key={patient._id || patient.id || index}
                  patient={patient}
                  // 🌟 AHORA SÍ ABRE EL EXPEDIENTE
                  onClick={(p) => handleOpenFolder(p._id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* 🌟 MODAL DE NUEVO PACIENTE */}
      <NewPatientModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onRefresh={fetchPatients}
      />

      <PatientFileModal
        isOpen={isFileModalOpen}
        patientId={selectedPatientId}
        onClose={() => setIsFileModalOpen(false)}
        onUpdate={fetchPatients}
      />

      <TreatmentManagerModal
        isOpen={isTreatmentModalOpen}
        onClose={() => setIsTreatmentModalOpen(false)}
      />
    </div>
  );
}
