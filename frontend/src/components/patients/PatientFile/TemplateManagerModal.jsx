"use client";
import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import {
  X,
  Plus,
  PencilLine,
  Trash,
  FloppyDiskBack,
  BookOpen,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { useScrollLock } from "@/hooks/useScrollLock";

const API = process.env.NEXT_PUBLIC_API_URL;

const EMPTY_POST_OP = { title: "", body: "", procedureTag: "" };
const EMPTY_PRESCRIPTION = {
  title: "",
  procedureTag: "",
  medications: [{ name: "", presentation: "", dose: "", route: "", frequency: "", duration: "" }],
  generalIndications: "",
};

const TemplateManagerModal = ({ isOpen, onClose, type }) => {
  useScrollLock(isOpen);
  const isPostOp = type === "postOp";
  const endpoint = isPostOp
    ? `${API}/templates/post-op-notes`
    : `${API}/templates/prescriptions`;

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // null | "new" | template object
  const [saving, setSaving] = useState(false);

  const emptyForm = isPostOp ? EMPTY_POST_OP : EMPTY_PRESCRIPTION;
  const [form, setForm] = useState(emptyForm);

  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("sbeltic_token")}`,
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { headers: authHeader() });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch {
      toast.error("Error al cargar plantillas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchTemplates();
  }, [isOpen]);

  const openNew = () => {
    setForm(emptyForm);
    setEditing("new");
  };

  const openEdit = (t) => {
    setForm(
      isPostOp
        ? { title: t.title, body: t.body, procedureTag: t.procedureTag || "" }
        : {
            title: t.title,
            procedureTag: t.procedureTag || "",
            medications: t.medications?.length
              ? t.medications
              : [{ name: "", presentation: "", dose: "", route: "", frequency: "", duration: "" }],
            generalIndications: t.generalIndications || "",
          },
    );
    setEditing(t);
  };

  const handleSave = async () => {
    if (!form.title?.trim()) return toast.error("El título es obligatorio");
    if (isPostOp && !form.body?.trim())
      return toast.error("El contenido es obligatorio");
    if (!isPostOp && !form.medications?.some((m) => m.name?.trim()))
      return toast.error("Agrega al menos un medicamento con nombre");

    setSaving(true);
    try {
      const isNew = editing === "new";
      const url = isNew ? endpoint : `${endpoint}/${editing._id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: authHeader(),
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(isNew ? "Plantilla creada" : "Plantilla actualizada");
        setEditing(null);
        fetchTemplates();
      } else {
        toast.error(data.message || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plantilla eliminada");
        fetchTemplates();
      }
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const addMedRow = () =>
    setForm({
      ...form,
      medications: [
        ...form.medications,
        { name: "", presentation: "", dose: "", route: "", frequency: "", duration: "" },
      ],
    });

  const removeMedRow = (i) =>
    setForm({
      ...form,
      medications: form.medications.filter((_, idx) => idx !== i),
    });

  const updateMed = (i, field, value) => {
    const meds = [...form.medications];
    meds[i] = { ...meds[i], [field]: value };
    setForm({ ...form, medications: meds });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-10002">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] bg-white rounded-modal shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
                <BookOpen size={20} weight="bold" />
              </div>
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                  {isPostOp ? "Plantillas Post-Op" : "Plantillas de Recetas"}
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {templates.length} plantillas activas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={openNew}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all"
              >
                <Plus size={14} weight="bold" /> Nueva
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* FORMULARIO DE CREACIÓN/EDICIÓN */}
            {editing && (
              <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-4xl space-y-4">
                <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">
                  {editing === "new" ? "Nueva plantilla" : "Editando plantilla"}
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Título</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white rounded-xl text-xs font-bold outline-none focus:ring-2 ring-indigo-200"
                      placeholder="Ej. Post-Mamoplastía"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Etiqueta / Procedimiento</label>
                    <input
                      type="text"
                      className="w-full p-3 bg-white rounded-xl text-xs font-bold outline-none focus:ring-2 ring-indigo-200"
                      placeholder="Ej. Cirugía Mamaria"
                      value={form.procedureTag}
                      onChange={(e) => setForm({ ...form, procedureTag: e.target.value })}
                    />
                  </div>
                </div>

                {isPostOp ? (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Contenido de la nota</label>
                    <textarea
                      rows={6}
                      className="w-full p-4 bg-white rounded-xl text-xs font-medium outline-none focus:ring-2 ring-indigo-200 resize-none"
                      placeholder="Escribe la nota post-operatoria base..."
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Medicamentos</label>
                        <button
                          onClick={addMedRow}
                          className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:text-indigo-800"
                        >
                          <Plus size={12} weight="bold" /> Agregar
                        </button>
                      </div>
                      {form.medications.map((med, i) => (
                        <div key={i} className="grid grid-cols-6 gap-2 items-start bg-white p-3 rounded-xl">
                          {[
                            { field: "name", placeholder: "Medicamento*", span: "col-span-2" },
                            { field: "presentation", placeholder: "Presentación" },
                            { field: "dose", placeholder: "Dosis" },
                            { field: "route", placeholder: "Vía" },
                            { field: "frequency", placeholder: "Frecuencia" },
                            { field: "duration", placeholder: "Duración" },
                          ].map(({ field, placeholder, span }) => (
                            <input
                              key={field}
                              type="text"
                              className={`p-2 bg-slate-50 rounded-lg text-[10px] font-medium outline-none focus:ring-1 ring-indigo-200 ${span || ""}`}
                              placeholder={placeholder}
                              value={med[field]}
                              onChange={(e) => updateMed(i, field, e.target.value)}
                            />
                          ))}
                          <button
                            onClick={() => removeMedRow(i)}
                            disabled={form.medications.length === 1}
                            className="p-2 text-slate-300 hover:text-rose-400 transition-all disabled:opacity-30"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Indicaciones generales</label>
                      <textarea
                        rows={3}
                        className="w-full p-4 bg-white rounded-xl text-xs font-medium outline-none focus:ring-2 ring-indigo-200 resize-none"
                        placeholder="Indicaciones de cuidado general..."
                        value={form.generalIndications}
                        onChange={(e) => setForm({ ...form, generalIndications: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                  >
                    <FloppyDiskBack size={16} weight="bold" />
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="px-5 py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE PLANTILLAS */}
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-16 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  Sin plantillas creadas
                </p>
              </div>
            ) : (
              templates.map((t) => (
                <div
                  key={t._id}
                  className="bg-white border border-slate-100 rounded-[1.5rem] p-5 flex items-start justify-between gap-4 hover:border-indigo-100 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase text-slate-900 tracking-wide truncate">
                      {t.title}
                    </p>
                    {t.procedureTag && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        {t.procedureTag}
                      </span>
                    )}
                    {isPostOp ? (
                      <p className="mt-2 text-[10px] text-slate-400 line-clamp-2">{t.body}</p>
                    ) : (
                      <p className="mt-1 text-[9px] font-bold text-slate-400 uppercase">
                        {t.medications?.length || 0} medicamento(s)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(t)}
                      className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                    >
                      <PencilLine size={15} weight="bold" />
                    </button>
                    <button
                      onClick={() => handleDelete(t._id)}
                      className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all"
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default TemplateManagerModal;
