// src/components/patients/PatientFile/index.jsx
"use client";
import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import FileHeader from "./FileHeader";
import HistoryTab from "./Tabs/HistoryTab";
import EvolutionTab from "./Tabs/EvolutionTab";
import SignatureTab from "./Tabs/SignatureTab";
import CouponsTab from "./Tabs/CouponsTab";
import { toast } from "sonner";

const PatientFileModal = ({ isOpen, patientId, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("history");
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patientId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) setPatient(data.data);
    } catch (error) {
      toast.error("Error al cargar expediente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientId) fetchPatientData();
  }, [isOpen, patientId]);

  // 🌟 LIMPIEZA AL CERRAR: Reseteamos para que al abrir otro paciente no haya "fantaseo" de datos
  useEffect(() => {
    if (!isOpen) {
      setPatient(null);
      setLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-10001">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4">
        <Dialog.Panel className="w-full max-w-5xl h-[95vh] md:h-[90vh] bg-white rounded-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
          <FileHeader
            patient={patient}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={onClose}
          />

          <div className="flex-1 overflow-y-auto p-4 md:p-10 scrollbar-hide">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full animate-pulse space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Sincronizando Sbeltic Cloud...
                </p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {activeTab === "history" && (
                  <HistoryTab
                    patient={patient}
                    userRole="DOCTOR"
                    onUpdate={fetchPatientData}
                    onClose={onClose}
                  />
                )}
                {activeTab === "evolution" && (
                  <EvolutionTab
                    patient={patient}
                    userRole="DOCTOR"
                    onUpdate={fetchPatientData}
                  />
                )}
                {activeTab === "signatures" && (
                  <SignatureTab
                    patient={patient}
                    onUpdate={fetchPatientData}
                  />
                )}
                {activeTab === "coupons" && (
                  <CouponsTab patient={patient} />
                )}
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default PatientFileModal;
