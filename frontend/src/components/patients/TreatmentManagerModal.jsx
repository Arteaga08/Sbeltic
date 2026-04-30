"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Pill } from "@phosphor-icons/react";
import { useScrollLock } from "@/hooks/useScrollLock";

const API = process.env.NEXT_PUBLIC_API_URL;

const PERFORMER_ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "RECEPTIONIST", label: "Recepcionista" },
  { value: "BOTH", label: "Ambos" },
];

const ROOM_IDS = [
  { id: "CABINA_1", label: "Cabina 1" },
  { id: "CABINA_2", label: "Cabina 2" },
  { id: "CABINA_3", label: "Cabina 3" },
  { id: "SPA", label: "Spa" },
  { id: "CONSULTORIO", label: "Consultorio" },
  { id: "QUIROFANO", label: "Quirófano" },
];
const BOT_FLOWS = ["NONE", "AGENDAR", "CONSULTA", "BOTH"];

const COLOR_OPTIONS = [
  {
    label: "Rosa",
    colorClass: "bg-rose-500 text-white",
    dotClass: "bg-rose-500",
    swatch: "bg-rose-500",
  },
  {
    label: "Ámbar",
    colorClass: "bg-amber-400 text-white",
    dotClass: "bg-amber-400",
    swatch: "bg-amber-400",
  },
  {
    label: "Morado",
    colorClass: "bg-purple-500 text-white",
    dotClass: "bg-purple-500",
    swatch: "bg-purple-500",
  },
  {
    label: "Azul",
    colorClass: "bg-blue-500 text-white",
    dotClass: "bg-blue-500",
    swatch: "bg-blue-500",
  },
  {
    label: "Rosa chicle",
    colorClass: "bg-pink-500 text-white",
    dotClass: "bg-pink-500",
    swatch: "bg-pink-500",
  },
  {
    label: "Verde",
    colorClass: "bg-emerald-500 text-white",
    dotClass: "bg-emerald-500",
    swatch: "bg-emerald-500",
  },
  {
    label: "Gris",
    colorClass: "bg-slate-600 text-white",
    dotClass: "bg-slate-500",
    swatch: "bg-slate-500",
  },
  {
    label: "Teal",
    colorClass: "bg-teal-500 text-white",
    dotClass: "bg-teal-500",
    swatch: "bg-teal-500",
  },
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
  if (typeof window !== "undefined")
    return localStorage.getItem("sbeltic_token");
  return null;
}

const emptyForm = {
  name: "",
  description: "",
  durationHours: 0,
  durationMinutes: 30,
  performerRole: "BOTH",
  suggestedTouchUpDays: "",
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
  useScrollLock(isOpen);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

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
      if (list.length > 0 && !activeCategory) setActiveCategory(list[0].slug);
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
    const duration =
      Number(form.durationHours) * 60 + Number(form.durationMinutes);
    if (duration < 15) return toast.error("La duración mínima es 15 minutos");

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: activeCategory,
        estimatedDuration: duration,
        performerRole: form.performerRole,
        ...(form.suggestedTouchUpDays && {
          suggestedTouchUpDays: Number(form.suggestedTouchUpDays),
        }),
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
        ...(catForm.colorClass.trim() && {
          colorClass: catForm.colorClass.trim(),
        }),
        ...(catForm.dotClass.trim() && { dotClass: catForm.dotClass.trim() }),
      };

      const url = editingCat
        ? `${API}/treatment-categories/${editingCat._id}`
        : `${API}/treatment-categories`;
      const res = await fetch(url, {
        method: editingCat ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(
          editingCat ? "Categoría actualizada" : "Categoría creada",
        );
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

  if (!isOpen) return null;

  const activeCat = categories.find((c) => c.slug === activeCategory);
  const categoryTreatments = treatments.filter(
    (t) => t.category?.toUpperCase() === activeCategory,
  );

  return (
    // 🚀 CAMBIO 1: Eliminamos `items-end`, ahora es `items-center` SIEMPRE.
    // Añadimos `p-4 sm:p-6` para forzar un margen seguro alrededor del modal en móviles.
    // Cambiamos z-50 a z-[9999] por si algún otro elemento se estaba sobreponiendo.
    <div className="fixed top-0 left-0 w-screen h-dvh bg-slate-900/70 backdrop-blur-sm z-9999 flex items-center justify-center p-4 sm:p-6">
      {/* 🚀 CAMBIO 2: 
          - max-w-lg (es más angosto y estético).
          - max-h-[85dvh]: dvh es clave para que los celulares respeten su propia barra de navegación.
          - rounded-2xl parejo, sin ese efecto raro de modal inferior.
      */}
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85dvh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0 bg-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Configuración
            </p>
            <h2 className="text-base font-black italic uppercase text-slate-900">
              Tratamientos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-100 shrink-0 px-3 gap-2 py-2 scrollbar-hide bg-white">
          {categories.length === 0 ? (
            <p className="text-[10px] text-slate-400 font-bold px-2 py-1">
              Sin categorías
            </p>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  setActiveCategory(cat.slug);
                  setShowForm(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all shrink-0
                ${activeCategory === cat.slug ? cat.colorClass || "bg-teal-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>

        {/* Content (Scrollable Area) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 bg-white">
          {categories.length > 0 &&
            (loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : categoryTreatments.length === 0 ? (
              <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xl mb-1"><Pill size={20} weight="duotone" /></p>
                <p className="text-[11px] font-bold uppercase tracking-wide">
                  Sin tratamientos
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categoryTreatments.map((t) => (
                  <div
                    key={t._id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${activeCat?.dotClass || "bg-teal-500"}`}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-800 truncate">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {formatDuration(t.estimatedDuration)}{" "}
                          {t.performerRole && `· ${t.performerRole}`}
                          {t.suggestedTouchUpDays ? ` · Retoque: ${t.suggestedTouchUpDays}d` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeactivate(t._id)}
                      className="text-slate-300 hover:text-rose-500 font-bold px-2 py-1 bg-white rounded-lg border border-slate-100 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all text-[10px]"
                    >
                      Borrar
                    </button>
                  </div>
                ))}
              </div>
            ))}

          {/* ADD TREATMENT FORM */}
          {categories.length > 0 &&
            (showForm ? (
              <form
                onSubmit={handleSave}
                className="bg-slate-50/50 rounded-2xl p-4 space-y-3 border border-slate-200"
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Nuevo tratamiento
                </p>
                <input
                  type="text"
                  placeholder="Nombre *"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  autoFocus
                />

                <input
                  type="text"
                  placeholder="Descripción (opcional)"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                      Duración
                    </label>
                    <div className="flex gap-1">
                      <select
                        value={form.durationHours}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            durationHours: Number(e.target.value),
                          }))
                        }
                        className="flex-1 px-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none text-center"
                      >
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((h) => (
                          <option key={h} value={h}>
                            {h}h
                          </option>
                        ))}
                      </select>
                      <select
                        value={form.durationMinutes}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            durationMinutes: Number(e.target.value),
                          }))
                        }
                        className="flex-1 px-1 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none text-center"
                      >
                        {[0, 15, 30, 45].map((m) => (
                          <option key={m} value={m}>
                            {m}m
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                      Realiza
                    </label>
                    <select
                      value={form.performerRole}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          performerRole: e.target.value,
                        }))
                      }
                      className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none"
                    >
                      {PERFORMER_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                    Dias para retoque (opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ej. 14"
                    value={form.suggestedTouchUpDays}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        suggestedTouchUpDays: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setForm(emptyForm);
                    }}
                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-[11px] uppercase tracking-wide transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-lg text-[11px] uppercase tracking-wide transition-colors disabled:opacity-50"
                  >
                    {saving ? "..." : "Guardar"}
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-xl border border-dashed text-[10px] font-black uppercase tracking-widest border-slate-300 text-slate-500 hover:bg-slate-50 hover:border-teal-400 hover:text-teal-600 transition-all"
              >
                + Agregar Tratamiento
              </button>
            ))}

          {/* ADMIN: MANAGE CATEGORIES */}
          {userRole === "ADMIN" && (
            <div className="border border-slate-200 rounded-xl overflow-hidden mt-4 bg-slate-50/30">
              <button
                type="button"
                onClick={() => setShowCatManager(!showCatManager)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 transition-colors"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                  Ajustes de Categorías
                </p>
                <span className="text-slate-400 text-xs">
                  {showCatManager ? "▲" : "▼"}
                </span>
              </button>

              {showCatManager && (
                <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-100">
                  {categories.map((cat) => (
                    <div
                      key={cat._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-2 px-3 bg-white rounded-lg border border-slate-100 gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${cat.dotClass || "bg-teal-500"}`}
                        />
                        <span className="text-xs font-bold text-slate-700">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex gap-3 bg-slate-50 px-2 py-1 rounded-md">
                        <button
                          onClick={() => handleEditCat(cat)}
                          className="text-[9px] font-black uppercase text-teal-600 hover:underline"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCat(cat._id)}
                          className="text-[9px] font-black uppercase text-rose-500 hover:underline"
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* FORM EDIT CATEGORY */}
                  {showCatForm ? (
                    <form
                      onSubmit={handleSaveCat}
                      className="bg-white rounded-xl p-4 border border-slate-200 space-y-4 shadow-sm mt-3"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={catForm.name}
                            onChange={(e) =>
                              setCatForm((f) => ({
                                ...f,
                                name: e.target.value,
                                slug: editingCat
                                  ? f.slug
                                  : e.target.value
                                      .toUpperCase()
                                      .replace(/[^A-Z0-9]/g, "_"),
                              }))
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-teal-400"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">
                            Slug
                          </label>
                          <input
                            type="text"
                            value={catForm.slug}
                            onChange={(e) =>
                              setCatForm((f) => ({
                                ...f,
                                slug: e.target.value.toUpperCase(),
                              }))
                            }
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-slate-50 focus:outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">
                            Salas (Bot)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {ROOM_IDS.map((r) => (
                              <button
                                key={r.id}
                                type="button"
                                onClick={() =>
                                  setCatForm((f) => ({
                                    ...f,
                                    roomIds: f.roomIds.includes(r.id)
                                      ? f.roomIds.filter((id) => id !== r.id)
                                      : [...f.roomIds, r.id],
                                  }))
                                }
                                className={`px-2 py-1 rounded-md text-[9px] font-bold border ${catForm.roomIds.includes(r.id) ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200"}`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">
                            Flujo (Bot)
                          </label>
                          <select
                            value={catForm.botFlow}
                            onChange={(e) =>
                              setCatForm((f) => ({
                                ...f,
                                botFlow: e.target.value,
                              }))
                            }
                            className="w-full px-2 py-2 border border-slate-200 bg-white rounded-lg text-xs"
                          >
                            {BOT_FLOWS.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 block mb-1.5">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {COLOR_OPTIONS.map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() =>
                                setCatForm((f) => ({
                                  ...f,
                                  colorClass: opt.colorClass,
                                  dotClass: opt.dotClass,
                                }))
                              }
                              className={`w-6 h-6 rounded-full ${opt.swatch} ${catForm.colorClass === opt.colorClass ? "ring-2 ring-offset-2 ring-slate-900 scale-110" : "opacity-50 hover:opacity-100"} transition-all`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCatForm(false);
                            setEditingCat(null);
                            setCatForm(emptyCatForm);
                          }}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg text-[10px] uppercase tracking-wider"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingCat}
                          className="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white font-black rounded-lg text-[10px] uppercase tracking-wider disabled:opacity-50"
                        >
                          {savingCat ? "..." : "Guardar"}
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
                      className="w-full py-2.5 mt-2 border border-dashed border-slate-300 bg-white text-[10px] font-black uppercase tracking-widest text-slate-400 rounded-lg hover:border-teal-400 hover:text-teal-600 transition-colors"
                    >
                      + Nueva Categoría
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
