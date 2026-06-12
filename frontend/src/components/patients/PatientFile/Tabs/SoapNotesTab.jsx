"use client";
import { useState, useEffect } from "react";
import {
  Stethoscope,
  Plus,
  FloppyDiskBack,
  CaretLeft,
  BookOpen,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { CONNECTION_ERROR } from "@/lib/apiError";
import FormError from "@/components/ui/FormError";
import TemplateManagerModal from "../TemplateManagerModal";

const API = process.env.NEXT_PUBLIC_API_URL;

// Secciones del estándar SOAP (referencia NCBI NBK482263) — en español
const SOAP_SECTIONS = [
  {
    key: "subjective",
    letter: "S",
    label: "Subjetivo",
    help: "Lo que refiere el paciente: motivo de consulta, padecimiento actual, síntomas y antecedentes que reporta.",
    placeholder:
      "Motivo de consulta, padecimiento actual, síntomas referidos por el paciente...",
  },
  {
    key: "objective",
    letter: "O",
    label: "Objetivo",
    help: "Datos medibles/observables: signos vitales, exploración física, resultados de laboratorio o estudios.",
    placeholder:
      "Signos vitales, exploración física, resultados de laboratorio o estudios...",
  },
  {
    key: "assessment",
    letter: "A",
    label: "Análisis / Evaluación",
    help: "Impresión diagnóstica, diagnóstico(s) y diagnósticos diferenciales.",
    placeholder: "Impresión diagnóstica, diagnósticos y diferenciales...",
  },
  {
    key: "plan",
    letter: "P",
    label: "Plan",
    help: "Tratamiento, estudios solicitados, referencias, educación al paciente y seguimiento.",
    placeholder:
      "Tratamiento, estudios, referencias, educación al paciente y seguimiento...",
  },
];

const EMPTY_FORM = {
  title: "",
  subjective: "",
  objective: "",
  assessment: "",
  plan: "",
  templateId: undefined,
};

const SoapNotesTab = ({ patient, userRole, onUpdate }) => {
  const [view, setView] = useState("LIST"); // LIST | FORM
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [showManager, setShowManager] = useState(false);
  const [formError, setFormError] = useState("");

  const canCreate = ["DOCTOR", "ADMIN"].includes(userRole);

  const fetchTemplates = async () => {
    try {
      const res = await fetchWithAuth(`${API}/templates/soap-notes`);
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch {
      // silencioso — la lista vacía no es un error crítico
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
      setForm({
        title: tpl.title || "",
        subjective: tpl.subjective || "",
        objective: tpl.objective || "",
        assessment: tpl.assessment || "",
        plan: tpl.plan || "",
        templateId: tpl._id,
      });
    }
  };

  const handleSave = async () => {
    setFormError("");
    const hasContent = SOAP_SECTIONS.some((s) => form[s.key]?.trim());
    if (!hasContent)
      return setFormError("Completa al menos una sección de la nota SOAP.");

    setIsSaving(true);
    try {
      const res = await fetchWithAuth(
        `${API}/patients/${patient._id}/soap-notes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Nota SOAP guardada");
        setView("LIST");
        setForm(EMPTY_FORM);
        setSelectedTemplate("");
        onUpdate();
      } else {
        setFormError(data.message || "No se pudo guardar la nota SOAP.");
      }
    } catch {
      setFormError(CONNECTION_ERROR);
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
            Nueva Nota SOAP
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
            <option value="">— Sin plantilla (nota libre) —</option>
            {templates.map((t) => (
              <option key={t._id} value={t._id}>
                {t.title}
                {t.procedureTag ? ` · ${t.procedureTag}` : ""}
              </option>
            ))}
          </select>
        </section>

        {/* Título opcional */}
        <section className="space-y-2">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">
            Título / Motivo de consulta (opcional)
          </label>
          <input
            type="text"
            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs text-slate-700 outline-none focus:ring-2 ring-indigo-200"
            placeholder="Ej. Consulta de control post-quirúrgico"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </section>

        {/* Campos SOAP */}
        <section className="space-y-6 bg-slate-900 p-8 rounded-modal text-white">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <Stethoscope size={22} weight="fill" className="text-indigo-400" />
            <h4 className="text-[11px] font-black uppercase tracking-widest italic text-indigo-100">
              Nota Clínica SOAP
            </h4>
          </div>

          {SOAP_SECTIONS.map((s) => (
            <div key={s.key} className="space-y-2">
              <div className="flex items-baseline gap-2 ml-2">
                <span className="text-sm font-black italic text-indigo-400">
                  {s.letter}
                </span>
                <label className="text-[9px] font-black uppercase text-indigo-300">
                  {s.label}
                </label>
              </div>
              <p className="text-[9px] font-medium text-indigo-300/60 ml-2 leading-snug">
                {s.help}
              </p>
              <textarea
                rows={4}
                className="w-full p-5 bg-white/5 border border-white/10 rounded-3xl font-medium text-xs outline-none focus:border-indigo-400 resize-none leading-relaxed"
                placeholder={s.placeholder}
                value={form[s.key]}
                onChange={(e) => setForm({ ...form, [s.key]: e.target.value })}
              />
            </div>
          ))}
        </section>

        <FormError message={formError} />

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-6 bg-indigo-600 text-white rounded-modal font-black text-xs uppercase tracking-wide-label shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {isSaving ? (
            "Guardando..."
          ) : (
            <>
              <FloppyDiskBack size={18} weight="bold" /> Guardar Nota
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
              Notas SOAP del Doctor
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {patient.soapNotes?.length || 0} registros
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
              <Plus size={18} weight="bold" /> Nueva Nota
            </button>
          )}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="space-y-4">
        {!patient.soapNotes?.length ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-modal border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Sin notas SOAP registradas
            </p>
          </div>
        ) : (
          [...patient.soapNotes].reverse().map((note, idx) => (
            <div
              key={note._id || idx}
              className="bg-white border border-slate-100 p-6 rounded-modal hover:border-indigo-200 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black italic shrink-0">
                  {new Date(note.createdAt).getDate()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase text-slate-900 italic truncate">
                    {note.title || "Nota clínica SOAP"}
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    {new Date(note.createdAt).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {note.createdBy?.name ? ` · ${note.createdBy.name}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 space-y-4">
                {SOAP_SECTIONS.map((s) =>
                  note[s.key]?.trim() ? (
                    <div key={s.key} className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-black italic text-indigo-500">
                          {s.letter}
                        </span>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
                          {s.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap pl-5">
                        {note[s.key]}
                      </p>
                    </div>
                  ) : null,
                )}
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
        type="soap"
      />
    </div>
  );
};

export default SoapNotesTab;
