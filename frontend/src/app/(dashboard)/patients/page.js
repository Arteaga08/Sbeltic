"use client";
import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlass, Plus, CaretLeft } from "@phosphor-icons/react";
import { toast } from "sonner";
import PatientStats from "@/components/patients/PatientStats";
import PatientCard from "@/components/patients/PatientCard";

// 🌟 IMPORTAMOS EL MODAL QUE ACABAMOS DE CREAR
import NewPatientModal from "@/components/patients/NewPatientModal";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentView, setCurrentView] = useState("DASHBOARD");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // 🌟 ESTADO PARA EL MODAL
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients?limit=1000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        // Tu backend separa por data.patients según el responseHandler
        setPatients(data.data.patients || []);
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
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm);
      const matchesCategory =
        selectedCategory === "ALL" || p.patientType === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [patients, searchTerm, selectedCategory]);

  return (
    <div className="space-y-10 p-4 md:p-8 pb-32 md:pb-8 max-w-full overflow-x-hidden">
      {/* HEADER SBELTIC STYLE */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="space-y-2 text-center md:text-left">
          {currentView === "LIST" && (
            <button
              onClick={() => setCurrentView("DASHBOARD")}
              className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 text-[9px] font-black uppercase tracking-widest mb-4 hover:gap-3 transition-all mx-auto md:mx-0"
            >
              <CaretLeft size={14} weight="bold" /> Volver al Directorio
            </button>
          )}
          <h2 className="text-4xl md:text-5xl font-extrabold italic uppercase text-slate-900 leading-none">
            {currentView === "DASHBOARD" ? "Directorio" : selectedCategory}
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            {currentView === "DASHBOARD"
              ? "Gestión de Pacientes Sbeltic"
              : `Filtrado por categoría`}
          </p>
        </div>

        {/* 🌟 BOTÓN CONECTADO AL MODAL */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
        >
          <Plus size={18} weight="bold" /> NUEVO REGISTRO
        </button>
      </header>

      {/* VISTA 1: DASHBOARD */}
      {currentView === "DASHBOARD" ? (
        <PatientStats
          counts={counts}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentView("LIST");
          }}
        />
      ) : (
        /* VISTA 2: LISTADO */
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <div className="relative max-w-xl mb-10 group mx-auto md:mx-0">
            <MagnifyingGlass
              size={20}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
            />
            <input
              type="text"
              placeholder={`BUSCAR EN ${selectedCategory}...`}
              className="w-full pl-14 pr-8 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600/20 transition-all font-bold text-[10px] uppercase tracking-widest"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient._id}
                patient={patient}
                onClick={(p) => toast.info(`Abriendo expediente de ${p.name}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 🌟 RENDERIZADO DEL MODAL */}
      <NewPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchPatients}
      />
    </div>
  );
}
