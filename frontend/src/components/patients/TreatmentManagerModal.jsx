"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL;

const PERFORMER_ROLES = [
  { value: "DOCTOR",      label: "Doctor" },
  { value: "RECEPTIONIST",label: "Recepcionista" },
  { value: "BOTH",        label: "Ambos" },
];

const ROOM_IDS = [
  { id: "CABINA_1",    label: "Cabina 1" },
  { id: "CABINA_2",    label: "Cabina 2" },
  { id: "CABINA_3",    label: "Cabina 3" },
  { id: "SPA",         label: "Spa" },
  { id: "CONSULTORIO", label: "Consultorio" },
  { id: "QUIROFANO",   label: "Quirófano" },
];
const BOT_FLOWS = ["NONE", "AGENDAR", "COTIZAR", "BOTH"];

const COLOR_OPTIONS = [
  { label: "Rosa",        colorClass: "bg-rose-500 text-white",    dotClass: "bg-rose-500",    swatch: "bg-rose-500"    },
  { label: "Ámbar",       colorClass: "bg-amber-400 text-white",   dotClass: "bg-amber-400",   swatch: "bg-amber-400"   },
  { label: "Morado",      colorClass: "bg-purple-500 text-white",  dotClass: "bg-purple-500",  swatch: "bg-purple-500"  },
  { label: "Azul",        colorClass: "bg-blue-500 text-white",    dotClass: "bg-blue-500",    swatch: "bg-blue-500"    },
  { label: "Rosa chicle", colorClass: "bg-pink-500 text-white",    dotClass: "bg-pink-500",    swatch: "bg-pink-500"    },
  { label: "Verde",       colorClass: "bg-emerald-500 text-white", dotClass: "bg-emerald-500", swatch: "bg-emerald-500" },
  { label: "Gris",        colorClass: "bg-slate-600 text-white",   dotClass: "bg-slate-500",   swatch: "bg-slate-500"   },
  { label: "Teal",        colorClass: "bg-teal-500 text-white",    dotClass: "bg-teal-500",    swatch: "bg-teal-500"    },
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

const emptyCatForm = {
  name: "",
  slug: "",
  roomIds: [],
  botFlow: "NONE",
  colorClass: "",
  dotClass: "",
};

export default function TreatmentManagerModal({ isOpen, onClose }) {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  // Category management
  const [userRole, setUserRole] = useState("");
  const [showCatManager, setShowCatManager] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [savingCat, setSavingCat] = useState(false);
  const [catForm, setCatForm] = useState(emptyCatForm);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchTreatments();
      try {
        const stored = localStorage.getItem("sbeltic_user");
        const u = stored ? JSON.parse(stored) : null;
        setUserRole(u?.role?.toUpperCase() || "");
      } catch {
        setUserRole("");
      }
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API}/treatment-categories`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      const list = data.data ?? [];
      setCategories(list);
      if (list.length > 0 && !activeCategory) {
        setActiveCategory(list[0].slug);
      }
    } catch {
      toast.error("Error al cargar categorías");
    }
  };

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

  // ── Category management handlers ──────────────────────────────────────────

  const handleEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      roomIds: cat.roomIds || [],
      botFlow: cat.botFlow || "NONE",
      colorClass: cat.colorClass || "",
      dotClass: cat.dotClass || "",
    });
    setShowCatForm(true);
  };

  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return toast.error("El nombre es obligatorio");
    if (!catForm.slug.trim()) return toast.error("El slug es obligatorio");

    setSavingCat(true);
    try {
      const payload = {
        name: catForm.name.trim(),
        slug: catForm.slug.trim(),
        botFlow: catForm.botFlow,
        roomIds: catForm.roomIds,
        ...(catForm.colorClass.trim() && { colorClass: catForm.colorClass.trim() }),
        ...(catForm.dotClass.trim() && { dotClass: catForm.dotClass.trim() }),
      };

      const url = editingCat
        ? `${API}/treatment-categories/${editingCat._id}`
        : `${API}/treatment-categories`;
      const method = editingCat ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(editingCat ? "Categoría actualizada" : "Categoría creada");
        if (!editingCat) setActiveCategory(data.data?.slug || null);
        setShowCatForm(false);
        setCatForm(emptyCatForm);
        setEditingCat(null);
        await fetchCategories();
      } else {
        toast.error(data.message || "Error al guardar");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCat = async (id) => {
    if (!confirm("¿Desactivar esta categoría?")) return;
    try {
      const res = await fetch(`${API}/treatment-categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        toast.success("Categoría desactivada");
        fetchCategories();
      }
    } catch {
      toast.error("Error al desactivar");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const activeCat = categories.find((c) => c.slug === activeCategory);
  const categoryTreatments = treatments.filter(
    (t) => t.category?.toUpperCase() === activeCategory,
  );

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
          {categories.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-bold px-2 py-2">Sin categorías — crea una abajo</p>
          ) : categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => { setActiveCategory(cat.slug); setShowForm(false); }}
              className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wide whitespace-nowrap transition-all shrink-0
                ${activeCategory === cat.slug
                  ? (cat.colorClass || "bg-teal-500 text-white")
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4">

          {/* Lista de tratamientos */}
          {categories.length > 0 && (
            loading ? (
              <div className="flex justify-center py-8">
                <div className="w-7 h-7 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categoryTreatments.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-3xl mb-2">💊</p>
                <p className="text-sm font-bold">Sin tratamientos en {activeCat?.name}</p>
                <p className="text-xs mt-1">Agrega el primero con el botón de abajo</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoryTreatments.map((t) => (
                  <div key={t._id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeCat?.dotClass || "bg-teal-500"}`} />
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
            )
          )}

          {/* Formulario para agregar tratamiento */}
          {categories.length > 0 && (
            showForm ? (
              <form onSubmit={handleSave} className="bg-slate-50 rounded-3xl p-5 space-y-4 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Nuevo tratamiento — {activeCat?.name}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full py-3.5 rounded-2xl border-2 border-dashed text-xs font-black uppercase tracking-wider transition-all border-slate-200 text-slate-400 hover:border-teal-300 hover:text-teal-500"
              >
                + Agregar tratamiento a {activeCat?.name}
              </button>
            )
          )}

          {/* ── Gestionar categorías (solo ADMIN) ─────────────────────────── */}
          {userRole === "ADMIN" && (
            <div className="border border-slate-100 rounded-3xl overflow-hidden">
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setShowCatManager(!showCatManager)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gestionar categorías</p>
                <span className="text-slate-300 text-xs font-bold">{showCatManager ? "▲" : "▼"}</span>
              </button>

              {showCatManager && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-100">
                  {/* Lista de categorías existentes */}
                  {categories.length > 0 && (
                    <div className="space-y-1.5 pt-3">
                      {categories.map((cat) => (
                        <div key={cat._id}
                          className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-2xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${cat.dotClass || "bg-teal-500"}`} />
                            <span className="text-sm font-bold text-slate-700 truncate">{cat.name}</span>
                            <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-lg shrink-0">
                              {cat.slug}
                            </span>
                            <span className="text-[9px] text-slate-400 shrink-0">{cat.botFlow}</span>
                          </div>
                          <div className="flex gap-2 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleEditCat(cat)}
                              className="text-[10px] font-black uppercase text-slate-400 hover:text-teal-500 transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCat(cat._id)}
                              className="text-slate-300 hover:text-rose-400 font-bold text-sm transition-colors"
                              title="Desactivar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formulario crear/editar categoría */}
                  {showCatForm ? (
                    <form onSubmit={handleSaveCat} className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {editingCat ? "Editar categoría" : "Nueva categoría"}
                      </p>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Nombre *</label>
                          <input
                            type="text"
                            placeholder="Ej: Faciales"
                            value={catForm.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              setCatForm((f) => ({
                                ...f,
                                name,
                                slug: editingCat
                                  ? f.slug
                                  : name.toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, ""),
                              }));
                            }}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Slug *</label>
                          <input
                            type="text"
                            placeholder="Ej: FACIAL"
                            value={catForm.slug}
                            onChange={(e) =>
                              setCatForm((f) => ({
                                ...f,
                                slug: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""),
                              }))
                            }
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>

                      {/* Salas del bot — multi-selección */}
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Salas del bot</label>
                        <div className="flex flex-wrap gap-2">
                          {ROOM_IDS.map((r) => {
                            const selected = catForm.roomIds.includes(r.id);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() =>
                                  setCatForm((f) => ({
                                    ...f,
                                    roomIds: selected
                                      ? f.roomIds.filter((id) => id !== r.id)
                                      : [...f.roomIds, r.id],
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  selected
                                    ? "bg-slate-900 text-white border-slate-900"
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-400"
                                }`}
                              >
                                {r.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Flujo bot */}
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Flujo bot</label>
                        <select
                          value={catForm.botFlow}
                          onChange={(e) => setCatForm((f) => ({ ...f, botFlow: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-400"
                        >
                          {BOT_FLOWS.map((b) => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>

                      {/* Selector de color */}
                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-2">Color de categoría</label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((opt) => {
                            const isSelected = catForm.colorClass === opt.colorClass;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                title={opt.label}
                                onClick={() =>
                                  setCatForm((f) => ({
                                    ...f,
                                    colorClass: opt.colorClass,
                                    dotClass: opt.dotClass,
                                  }))
                                }
                                className={`w-7 h-7 rounded-full transition-all ${opt.swatch} ${
                                  isSelected ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "opacity-70 hover:opacity-100"
                                }`}
                              />
                            );
                          })}
                        </div>
                        {/* Preview del tab */}
                        {catForm.colorClass && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wide pointer-events-none ${catForm.colorClass}`}
                            >
                              {catForm.name || "Vista previa"}
                            </button>
                            <div className={`w-2.5 h-2.5 rounded-full ${catForm.dotClass}`} />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCatForm(false);
                            setCatForm(emptyCatForm);
                            setEditingCat(null);
                          }}
                          className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingCat}
                          className="flex-1 py-2.5 bg-slate-900 text-white font-black rounded-xl text-sm hover:bg-teal-600 transition-colors disabled:opacity-50"
                        >
                          {savingCat ? "Guardando..." : (editingCat ? "Actualizar" : "Crear categoría")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setCatForm(emptyCatForm);
                        setEditingCat(null);
                        setShowCatForm(true);
                      }}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-xs font-black uppercase tracking-wider text-slate-400 hover:border-teal-300 hover:text-teal-500 transition-all mt-2"
                    >
                      + Nueva categoría
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
