"use client";
import { useState, useEffect } from "react";
import {
  NotePencil,
  Plus,
  FloppyDiskBack,
  CaretLeft,
  BookOpen,
  ClockCounterClockwise,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import TemplateManagerModal from "../TemplateManagerModal";

const API = process.env.NEXT_PUBLIC_API_URL;

const PostOpNotesTab = ({ patient, userRole, onUpdate }) => {
  const [view, setView] = useState("LIST"); // LIST | FORM
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [form, setForm] = useState({ title: "", body: "", templateId: undefined });
  const [isSaving, setIsSaving] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const canCreate = ["DOCTOR", "ADMIN"].includes(userRole);

  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("sbeltic_token")}`,
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API}/templates/post-op-notes`, {
        headers: authHeader(),
      });
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
      setForm({ title: tpl.title, body: tpl.body, templateId: tpl._id });
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error("El título es obligatorio");
    if (!form.body.trim()) return toast.error("El contenido es obligatorio");

    setIsSaving(true);
    try {
      const res = await fetch(`${API}/patients/${patient._id}/post-op-notes`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Nota post-operatoria guardada");
        setView("LIST");
        setForm({ title: "", body: "", templateId: undefined });
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
            Nueva Nota Post-Op
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
                {t.title}{t.procedureTag ? ` · ${t.procedureTag}` : ""}
              </option>
            ))}
          </select>
        </section>

        {/* Campos editables */}
        <section className="space-y-6 bg-slate-900 p-8 rounded-modal text-white">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <NotePencil size={22} weight="fill" className="text-indigo-400" />
            <h4 className="text-[11px] font-black uppercase tracking-widest italic text-indigo-100">
              Nota Post-Operatoria
            </h4>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">Título</label>
            <input
              type="text"
              className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-xs outline-none focus:border-indigo-400"
              placeholder="Ej. Nota Post-Op Mamoplastía Aumentativa"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-indigo-300 ml-2">Contenido de la nota</label>
            <textarea
              rows={10}
              className="w-full p-6 bg-white/5 border border-white/10 rounded-3xl font-medium text-xs outline-none focus:border-indigo-400 resize-none leading-relaxed"
              placeholder="Escribe aquí las observaciones post-operatorias específicas del paciente..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
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
              Notas Post-Operatorias
            </h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {patient.postOpNotes?.length || 0} registros
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
        {!patient.postOpNotes?.length ? (
          <div className="py-20 text-center bg-slate-50/50 rounded-modal border-2 border-dashed border-slate-100">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
              Sin notas post-operatorias registradas
            </p>
          </div>
        ) : (
          [...patient.postOpNotes].reverse().map((note, idx) => (
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
                    {note.title}
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
              <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {note.body}
                </p>
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
        type="postOp"
      />
    </div>
  );
};

export default PostOpNotesTab;
