"use client";
import { useState } from "react";
import {
  Plus,
  ClockCounterClockwise,
  Heartbeat,
  Stethoscope,
  NotePencil,
  CaretLeft,
  CheckCircle,
  FilePdf,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import SignaturePad from "../SignaturePad";
import { PDFDownloadLink } from "@react-pdf/renderer";
import EvolutionPDF from "./EvolutionPDF";
import WhatsAppSignatureButton from "../../shared/WhatsAppSignatureButton";

const EvolutionTab = ({ patient, userRole, onUpdate }) => {
  const [view, setView] = useState("LIST"); // LIST o FORM
  const [isSaving, setIsSaving] = useState(false);

  // Estado inicial del formulario de evolución
  const [evolutionData, setEvolutionData] = useState({
    vitals: { ta: "", fc: "", fr: "", temp: "", imc: "" },
    physicalExam: {
      habitusExterior: "",
      head: "",
      neck: "",
      thorax: "",
      back: "",
      abdomen: "",
      upperLimbs: "",
      lowerLimbs: "",
      glutealZone: "",
      genitals: "",
    },
    labResults: "",
    diagnosis: "",
    prognosis: "",
    indications: "",
    patientSignature: "",
    doctorSignature: "",
  });

  const canCreate = userRole === "DOCTOR";

  const handleSave = async () => {
    if (!evolutionData.diagnosis || !evolutionData.indications) {
      return toast.error("El diagnóstico e indicaciones son obligatorios");
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patient._id}/evolutions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(evolutionData),
        },
      );

      const data = await res.json();
      if (data.success) {
        toast.success("Evolución guardada correctamente");
        setView("LIST");
        onUpdate(); // Refresca el expediente
      }
    } catch (error) {
      toast.error("Error al guardar la evolución");
    } finally {
      setIsSaving(false);
    }
  };

  if (view === "FORM") {
    return (
      <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 pb-20">
        {/* HEADER DEL FORMULARIO */}
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <button
            onClick={() => setView("LIST")}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <CaretLeft size={16} weight="bold" /> Volver al Historial
          </button>
          <h3 className="text-sm font-black italic uppercase text-slate-900 tracking-widest">
            Nueva Evolución Médica
          </h3>
        </div>

        {/* 1. SIGNOS VITALES */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Heartbeat size={24} weight="fill" className="text-rose-500" />
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest italic">
              Signos Vitales
            </h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-6 rounded-[2.5rem]">
            {[
              { id: "ta", label: "TA", sub: "MMHG" },
              { id: "fc", label: "FC", sub: "X'" },
              { id: "fr", label: "FR", sub: "X'" },
              { id: "temp", label: "TEMP", sub: "°C" },
              { id: "imc", label: "IMC", sub: "INDICE" },
            ].map((v) => (
              <div key={v.id} className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2">
                  {v.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-4 bg-white rounded-2xl font-bold text-xs outline-none focus:ring-2 ring-rose-100"
                    value={evolutionData.vitals[v.id]}
                    onChange={(e) =>
                      setEvolutionData({
                        ...evolutionData,
                        vitals: {
                          ...evolutionData.vitals,
                          [v.id]: e.target.value,
                        },
                      })
                    }
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] font-black text-slate-300">
                    {v.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. EXPLORACIÓN FÍSICA */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Stethoscope size={24} weight="fill" className="text-indigo-500" />
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest italic">
              Exploración Física
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(evolutionData.physicalExam).map((key) => (
              <div key={key} className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 italic">
                  {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                </label>
                <textarea
                  className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-[10px] uppercase outline-none focus:bg-indigo-50/30 transition-colors min-h-20"
                  value={evolutionData.physicalExam[key]}
                  onChange={(e) =>
                    setEvolutionData({
                      ...evolutionData,
                      physicalExam: {
                        ...evolutionData.physicalExam,
                        [key]: e.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* 3. DIAGNÓSTICO Y PLAN */}
        <section className="space-y-6 bg-slate-900 p-8 md:p-12 rounded-[2.5rem] text-white">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6 mb-6">
            <NotePencil size={24} weight="fill" className="text-indigo-400" />
            <h4 className="text-[11px] font-black uppercase tracking-widest italic text-indigo-100">
              Plan Terapéutico
            </h4>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">
                Diagnóstico o Problemas Clínicos
              </label>
              <textarea
                className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl font-bold text-xs outline-none focus:border-indigo-400"
                value={evolutionData.diagnosis}
                onChange={(e) =>
                  setEvolutionData({
                    ...evolutionData,
                    diagnosis: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">
                  Pronóstico
                </label>
                <input
                  type="text"
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs outline-none"
                  value={evolutionData.prognosis}
                  onChange={(e) =>
                    setEvolutionData({
                      ...evolutionData,
                      prognosis: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">
                  Indicación Terapéutica
                </label>
                <textarea
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs outline-none"
                  value={evolutionData.indications}
                  onChange={(e) =>
                    setEvolutionData({
                      ...evolutionData,
                      indications: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. FIRMAS FINALES Y REMOTA 🌟 */}
        <section className="space-y-6 pt-10 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50/50 p-6 md:p-8 rounded-[2.5rem] border border-emerald-100/50">
            <div className="space-y-1">
              <h4 className="text-[11px] font-black uppercase text-emerald-800 italic">
                Firma Remota de Paciente
              </h4>
              <p className="text-[9px] font-bold text-emerald-600/70 uppercase">
                ¿El paciente prefiere firmar en su celular?
              </p>
            </div>

            <WhatsAppSignatureButton
              patientPhone={patient.phone}
              patientName={patient.name}
              patientId={patient._id}
              type="EVOLUTION"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <SignaturePad
              label="Firma local del Paciente"
              onSave={(sig) =>
                setEvolutionData({ ...evolutionData, patientSignature: sig })
              }
            />
            <SignaturePad
              label="Firma del Médico Responsable"
              onSave={(sig) =>
                setEvolutionData({ ...evolutionData, doctorSignature: sig })
              }
            />
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]"
        >
          {isSaving
            ? "Finalizando Consulta..."
            : "Finalizar y Guardar Evolución"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* MODO LISTA (Timeline) */}
      <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
            <ClockCounterClockwise size={24} weight="bold" />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest leading-none">
              Historial de Consultas
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {patient.evolutions?.length || 0} Registros encontrados
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={() => setView("FORM")}
            className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Plus size={18} weight="bold" /> Nueva Evolución
          </button>
        )}
      </div>

      {/* TIMELINE DE EVOLUCIONES */}
      <div className="space-y-4">
        {patient.evolutions?.length === 0 ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Aún no hay notas de evolución para este paciente
            </p>
          </div>
        ) : (
          [...patient.evolutions].reverse().map((ev, idx) => (
            <div
              key={idx}
              className="group bg-white border border-slate-100 p-6 rounded-[2.5rem] hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black italic">
                    {new Date(ev.createdAt).getDate()}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-900 italic">
                      {new Date(ev.createdAt).toLocaleDateString("es-MX", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Dr. {ev.doctorName || "Sbeltic Medical Staff"}
                    </p>
                  </div>
                </div>

                {/* 🌟 AQUÍ ESTÁ LA MAGIA DEL PDF CON TU MISMO DISEÑO */}
                <PDFDownloadLink
                  document={<EvolutionPDF patient={patient} evolution={ev} />}
                  fileName={`Nota_Medica_${patient.name.replace(/\s+/g, "_")}_${new Date(ev.createdAt).toLocaleDateString("es-MX").replace(/\//g, "-")}.pdf`}
                >
                  {({ loading }) => (
                    <button
                      disabled={loading}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Descargar Nota Médica PDF"
                    >
                      {loading ? (
                        <div className="w-4.5 h-4.5 border-2 border-slate-300 border-t-current rounded-full animate-spin" />
                      ) : (
                        <FilePdf size={18} weight="bold" />
                      )}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-slate-50/50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-300 uppercase">
                    Diagnóstico
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 line-clamp-1 mt-1 uppercase italic">
                    {ev.diagnosis}
                  </p>
                </div>
                {/* ... más mini-resúmenes de la evolución si quieres */}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EvolutionTab;
