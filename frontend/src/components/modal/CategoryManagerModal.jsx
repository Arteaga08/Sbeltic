"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Tag, Plus, Trash, CircleNotch } from "@phosphor-icons/react";
import { toast } from "sonner";

const CategoryManagerModal = ({ isOpen, onClose, type }) => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Colores dinámicos según el tipo de vista
  const isMedical = type === "INSUMO";
  const themeColor = isMedical
    ? {
        headerBg: "bg-indigo-50/50",
        iconText: "text-indigo-600",
        btnBg: "bg-indigo-600",
        btnHover: "hover:bg-indigo-700",
        btnShadow: "shadow-indigo-200",
        inputFocus: "focus:ring-indigo-500/20 focus:border-indigo-500",
        spinner: "text-indigo-500",
      }
    : {
        headerBg: "bg-emerald-50/50",
        iconText: "text-emerald-600",
        btnBg: "bg-emerald-600",
        btnHover: "hover:bg-emerald-700",
        btnShadow: "shadow-emerald-200",
        inputFocus: "focus:ring-emerald-500/20 focus:border-emerald-500",
        spinner: "text-emerald-500",
      };

  // 1. Obtener categorías existentes
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/categories?type=${type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      toast.error("Error al cargar las categorías");
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  // Ejecutar al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setNewCategoryName(""); // Limpiar el input al abrir
    }
  }, [isOpen, fetchCategories]);

  // 2. Crear nueva categoría
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryName, type }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Categoría creada con éxito");
        setNewCategoryName("");
        fetchCategories(); // Refrescar la lista
      } else {
        toast.error(data.message || "Error al crear la categoría");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Eliminar categoría
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "¿Seguro que deseas eliminar esta categoría? Asegúrate de que no tenga productos asignados.",
      )
    )
      return;

    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/categories/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      if (data.success) {
        toast.success("Categoría eliminada");
        fetchCategories(); // Refrescar la lista
      } else {
        toast.error(data.message || "No se pudo eliminar la categoría");
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header Dinámico */}
        <div
          className={`flex items-center justify-between p-6 border-b border-slate-100 bg-${themeColor}-50/50`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 bg-white text-${themeColor}-600 rounded-xl shadow-sm`}
            >
              <Tag size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic leading-tight">
                Categorías
              </h2>
              <p
                className={`text-[10px] font-bold text-${themeColor}-600 uppercase tracking-widest`}
              >
                {isMedical ? "Insumos Clínicos" : "Productos Retail"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green rounded-full transition-colors"
          >
            <X size={20} weight="bold" className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Formulario de Creación */}
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: Inyectables, Cremas, Toxinas..."
              className={`flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 transition-all outline-none text-slate-700 font-medium text-sm ${themeColor.inputFocus}`}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newCategoryName.trim()}
              className={`flex items-center justify-center px-4 text-white rounded-xl transition-all disabled:opacity-50 shadow-md ${
                isMedical
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
              }`}
            >
              {isSubmitting ? (
                <CircleNotch size={20} className="animate-spin" />
              ) : (
                <Plus size={20} weight="bold" />
              )}
            </button>
          </form>

          {/* Lista de Categorías Existentes */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Categorías Actuales ({categories.length})
            </h3>

            <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <CircleNotch
                    size={24}
                    className={`animate-spin text-${themeColor}-500`}
                  />
                </div>
              ) : categories.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                  <p className="text-sm font-medium text-slate-400">
                    No hay categorías registradas.
                  </p>
                </div>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors"
                  >
                    <span className="font-bold text-slate-700 text-sm uppercase">
                      {cat.name}
                    </span>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Eliminar categoría"
                    >
                      <Trash size={16} weight="bold" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagerModal;
