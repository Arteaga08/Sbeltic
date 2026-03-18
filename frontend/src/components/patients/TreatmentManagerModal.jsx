"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { TREATMENT_CATEGORIES, getCategoryById } from "@/lib/treatmentCategories";

const API = process.env.NEXT_PUBLIC_API_URL;

const PERFORMER_ROLES = [
  { value: "DOCTOR",      label: "Doctor" },
  { value: "RECEPTIONIST",label: "Recepcionista" },
  { value: "BOTH",        label: "Ambos" },
];

function formatDuration(mins) {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem("sbeltic_token");
  return null;
}

const emptyForm = {
  name: "",
  description: "",
  durationHours: 0,
  durationMinutes: 30,
  performerRole: "BOTH",
};

export default function TreatmentManagerModal({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState("CIRUGIA");
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isOpen) fetchTreatments();
  }, [isOpen]);

  const fetchTreatments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/treatments?limit=200`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const raw = data.data?.results ?? data.data ?? data.results ?? data;
      setTreatments(Array.isArray(raw) ? raw : []);
    } catch {
      toast.error("Error al cargar tratamientos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("El nombre es obligatorio");
    const duration = Number(form.durationHours) * 60 + Number(form.durationMinutes);
    if (duration < 15) return toast.error("La duración mínima es 15 minutos");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: activeCategory,
        estimatedDuration: duration,
        performerRole: form.performerRole,
      };

      const res = await fetch(`${API}/treatments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("Tratamiento agregado");
        setForm(emptyForm);
        setShowForm(false);
        fetchTreatments();
      } else {
        toast.error(data.message || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("¿Desactivar este tratamiento?")) return;
    try {
      const res = await fetch(`${API}/treatments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ isActive: false }),
      });
      if (res.ok) {
        toast.success("Tratamiento desactivado");
        fetchTreatments();
      }
    } catch {
      toast.error("Error al desactivar");
    }
  };

  if (!isOpen) return null;

  const categoryTreatments = treatments.filter(
    (t) => t.category?.toUpperCase() === activeCategory,
  );

  const activeCat = getCategoryById(activeCategory);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl rounded-t-4xl md:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] md:max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Configuración</p>
            <h2 className="text-xl font-black italic uppercase text-slate-900">Catálogo de Tratamientos</h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-colors text-slate-400 text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Tabs de categoría */}
        <div className="flex overflow-x-auto border-b border-slate-100 shrink-0 px-4 gap-1 py-2">
          {TREATMENT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setShowForm(false); }}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide whitespace-nowrap transition-all shrink-0
                ${activeCategory === cat.id
                  ? cat.colorClass
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Lista de tratamientos */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : categoryTreatments.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-2">💊</p>
              <p className="text-sm font-bold">Sin tratamientos en {activeCat?.label}</p>
              <p className="text-xs mt-1">Agrega el primero con el botón de abajo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categoryTreatments.map((t) => (
                <div key={t._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeCat?.dot}`} />
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-800 truncate">{t.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {formatDuration(t.estimatedDuration)}
                        {t.performerRole && ` · ${t.performerRole}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeactivate(t._id)}
                    className="text-slate-300 hover:text-rose-400 font-bold text-sm transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                    title="Desactivar"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario para agregar */}
          {showForm ? (
            <form onSubmit={handleSave} className="bg-slate-50 rounded-3xl p-5 space-y-4 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nuevo tratamiento — {activeCat?.label}
              </p>

              <input
                type="text"
                placeholder="Nombre del tratamiento *"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                autoFocus
              />

              <input
                type="text"
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
              />

              <div className="grid grid-cols-2 gap-3">
                {/* Duración */}
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">
                    Duración
                    {(Number(form.durationHours) * 60 + Number(form.durationMinutes)) > 0 && (
                      <span className="ml-1 text-teal-500 normal-case">
                        = {formatDuration(Number(form.durationHours) * 60 + Number(form.durationMinutes))}
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={form.durationHours}
                      onChange={(e) => setForm((f) => ({ ...f, durationHours: Number(e.target.value) }))}
                      className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-teal-400">
                      {[0,1,2,3,4,5,6,7,8].map((h) => <option key={h} value={h}>{h}h</option>)}
                    </select>
                    <select
                      value={form.durationMinutes}
                      onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                      className="flex-1 p-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-teal-400">
                      {[0,15,30,45].map((m) => <option key={m} value={m}>{m}min</option>)}
                    </select>
                  </div>
                </div>

                {/* Quién realiza */}
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">Realiza</label>
                  <select
                    value={form.performerRole}
                    onChange={(e) => setForm((f) => ({ ...f, performerRole: e.target.value }))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-teal-400">
                    {PERFORMER_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-slate-900 text-white font-black rounded-xl text-sm hover:bg-teal-600 transition-colors disabled:opacity-50">
                  {saving ? "Guardando..." : "Agregar tratamiento"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className={`w-full py-3.5 rounded-2xl border-2 border-dashed text-xs font-black uppercase tracking-wider transition-all
                border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-500`}
            >
              + Agregar tratamiento a {activeCat?.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
