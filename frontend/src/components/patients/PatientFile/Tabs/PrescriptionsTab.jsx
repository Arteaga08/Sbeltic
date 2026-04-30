"use client";
import { useState, useEffect } from "react";
import {
  Pill,
  Plus,
  Trash,
  FloppyDiskBack,
  CaretLeft,
  BookOpen,
  ClockCounterClockwise,
  FilePdf,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { PDFDownloadLink } from "@react-pdf/renderer";
import PrescriptionPDF from "./PrescriptionPDF";
import TemplateManagerModal from "../TemplateManagerModal";

const API = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_MED = { name: "", presentation: "", dose: "", route: "", frequency: "", duration: "" };

const emptyForm = () => ({
  title: "",
  medications: [{ ...EMPTY_MED }],
  generalIndications: "",
  templateId: undefined,
  doctorName: "",
  doctorLicense: "",
  doctorSignature: "",
});

const PrescriptionsTab = ({ patient, userRole, onUpdate }) => {
  const [view, setView] = useState("LIST");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const canCreate = ["DOCTOR", "ADMIN"].includes(userRole);

  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("sbeltic_token")}`,
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API}/templates/prescriptions`, {
        headers: authHeader(),
      });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (e) => {
    const id = e.target.value;
    setSelectedTemplate(id);
    if (!id) return;
    const tpl = templates.find((t) => t._id === id);
    if (tpl) {
      setForm((prev) => ({
        ...prev,
        title: tpl.title,
        medications: tpl.medications?.length ? tpl.medications.map((m) => ({ ...m })) : [{ ...EMPTY_MED }],
        generalIndications: tpl.generalIndications || "",
        templateId: tpl._id,
      }));
    }
  };

  const addMedRow = () =>
    setForm((prev) => ({ ...prev, medications: [...prev.medications, { ...EMPTY_MED }] }));

  const removeMedRow = (i) =>
    setForm((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, idx) => idx !== i),
    }));

  const updateMed = (i, field, value) => {
    const meds = [...form.medications];
    meds[i] = { ...meds[i], [field]: value };
    setForm((prev) => ({ ...prev, medications: meds }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("El título es obligatorio");
    if (!form.medications.some((m) => m.name.trim()))
      return toast.error("Agrega al menos un medicamento con nombre");

    setIsSaving(true);
    try {
      const res = await fetch(`${API}/patients/${patient._id}/prescriptions`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Receta médica guardada");
        setView("LIST");
        setForm(emptyForm());
        setSelectedTemplate("");
        onUpdate();
      } else {
        toast.error(data.message || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setIsSaving(false);
    }
  };

  if (view === "FORM") {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
        <div className="flex items-center justify-between border-b border-slate-50 pb-6">
          <button
            onClick={() => setView("LIST")}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <CaretLeft size={16} weight="bold" /> Volver
          </button>
          <h3 className="text-sm font-black italic uppercase text-slate-900 tracking-widest">
            Nueva Receta Médica
          </h3>
        </div>

        {/* Selector de plantilla */}
        <section className="space-y-3">
          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-widest">
            Cargar desde plantilla (opcional)
          </label>
          <select
            value={selectedTemplate}
            onChange={handleTemplateSelect}
            className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-200 cursor-pointer"
          >
            <option value="">— Sin plantilla (receta libre) —</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title}{t.procedureTag ? ` · ${t.procedureTag}` : ""}
              </option>
            ))}
          </select>
        </section>

        {/* Datos de la receta */}
        <section className="space-y-6 bg-slate-900 p-8 rounded-modal text-white">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <Pill size={22} weight="fill" className="text-indigo-400" />
            <h4 className="text-[11px] font-black uppercase tracking-widest italic text-indigo-100">
              Receta Médica
            </h4>
          </div>

          {/* Título */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">Título / Procedimiento</label>
            <input
              type="text"
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs outline-none focus:border-indigo-400"
              placeholder="Ej. Receta Post-Op Lipoescultura"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Medicamentos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">Medicamentos</label>
              <button
                onClick={addMedRow}
                className="text-[9px] font-black text-indigo-400 uppercase flex items-center gap-1 hover:text-indigo-200"
              >
                <Plus size={12} weight="bold" /> Agregar renglón
              </button>
            </div>

            {/* Headers */}
            <div className="hidden md:grid grid-cols-7 gap-2 px-1">
              {["Medicamento", "Presentación", "Dosis", "Vía", "Frecuencia", "Duración", ""].map(
                (h, i) => (
                  <span key={i} className="text-[8px] font-black uppercase text-indigo-400 tracking-widest">
                    {h}
                  </span>
                ),
              )}
            </div>

            {form.medications.map((med, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-7 gap-2 items-center bg-white/5 border border-white/10 p-3 rounded-2xl">
                {[
                  { field: "name", placeholder: "Medicamento*" },
                  { field: "presentation", placeholder: "Tabletas 10mg" },
                  { field: "dose", placeholder: "1 tab" },
                  { field: "route", placeholder: "VO" },
                  { field: "frequency", placeholder: "c/8h" },
                  { field: "duration", placeholder: "5 días" },
                ].map(({ field, placeholder }) => (
                  <input
                    key={field}
                    type="text"
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-medium outline-none focus:border-indigo-400 text-white placeholder:text-white/30"
                    placeholder={placeholder}
                    value={med[field]}
                    onChange={(e) => updateMed(i, field, e.target.value)}
                  />
                ))}
                <button
                  onClick={() => removeMedRow(i)}
                  disabled={form.medications.length === 1}
                  className="p-2 text-white/30 hover:text-rose-400 transition-all disabled:opacity-20 justify-self-center"
                >
                  <Trash size={15} weight="bold" />
                </button>
              </div>
            ))}
          </div>

          {/* Indicaciones generales */}
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">Indicaciones generales</label>
            <textarea
              rows={3}
              className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl font-medium text-xs outline-none focus:border-indigo-400 resize-none"
              placeholder="Indicaciones de cuidado y seguimiento..."
              value={form.generalIndications}
              onChange={(e) => setForm((prev) => ({ ...prev, generalIndications: e.target.value }))}
            />
          </div>
        </section>

        {/* Datos del médico */}
        <section className="bg-slate-50 p-6 rounded-4xl space-y-4">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
            Datos del médico (para el PDF)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nombre del médico</label>
              <input
                type="text"
                className="w-full p-3 bg-white rounded-xl text-xs font-bold outline-none focus:ring-2 ring-indigo-200"
                placeholder="Dr. Nombre Apellido"
                value={form.doctorName}
                onChange={(e) => setForm((prev) => ({ ...prev, doctorName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cédula profesional</label>
              <input
                type="text"
                className="w-full p-3 bg-white rounded-xl text-xs font-bold outline-none focus:ring-2 ring-indigo-200"
                placeholder="12345678"
                value={form.doctorLicense}
                onChange={(e) => setForm((prev) => ({ ...prev, doctorLicense: e.target.value }))}
              />
            </div>
          </div>
        </section>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 bg-indigo-600 text-white rounded-modal font-black text-xs uppercase tracking-wide-label shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {isSaving ? (
            "Guardando..."
          ) : (
            <>
              <FloppyDiskBack size={18} weight="bold" /> Guardar Receta
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER LISTA */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-slate-50 p-4 md:p-6 rounded-modal border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm text-slate-400">
            <ClockCounterClockwise size={24} weight="bold" />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest leading-none">
              Recetas Médicas
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {patient.prescriptions?.length || 0} registros
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canCreate && (
            <button
              onClick={() => setShowManager(true)}
              className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 transition-all"
            >
              <BookOpen size={16} weight="bold" /> Plantillas
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setView("FORM")}
              className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={18} weight="bold" /> Nueva Receta
            </button>
          )}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="space-y-4">
        {!patient.prescriptions?.length ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-modal border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Sin recetas médicas registradas
            </p>
          </div>
        ) : (
          [...patient.prescriptions].reverse().map((rx, idx) => (
            <div
              key={rx._id || idx}
              className="bg-white border border-slate-100 p-6 rounded-modal hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black italic shrink-0">
                    {new Date(rx.createdAt).getDate()}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-900 italic">
                      {rx.title}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {new Date(rx.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {rx.doctorName ? ` · Dr. ${rx.doctorName}` : ""}
                    </p>
                  </div>
                </div>

                <PDFDownloadLink
                  document={<PrescriptionPDF patient={patient} prescription={rx} />}
                  fileName={`Receta_${patient.name.replace(/\s+/g, "_")}_${new Date(rx.createdAt).toLocaleDateString("es-MX").replace(/\//g, "-")}.pdf`}
                >
                  {({ loading }) => (
                    <button
                      disabled={loading}
                      className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                      title="Descargar Receta PDF"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-current rounded-full animate-spin" />
                      ) : (
                        <FilePdf size={18} weight="bold" />
                      )}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-2">
                  {rx.medications?.length || 0} medicamento(s)
                </p>
                <div className="space-y-1">
                  {rx.medications?.slice(0, 3).map((med, i) => (
                    <p key={i} className="text-[10px] font-medium text-slate-600">
                      • {med.name}{med.dose ? ` — ${med.dose}` : ""}{med.frequency ? `, ${med.frequency}` : ""}
                    </p>
                  ))}
                  {rx.medications?.length > 3 && (
                    <p className="text-[9px] font-bold text-indigo-400">
                      +{rx.medications.length - 3} más...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <TemplateManagerModal
        isOpen={showManager}
        onClose={() => {
          setShowManager(false);
          fetchTemplates();
        }}
        type="prescription"
      />
    </div>
  );
};

export default PrescriptionsTab;
