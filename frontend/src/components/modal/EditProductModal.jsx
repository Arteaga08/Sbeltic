"use client";
import { useState, useEffect } from "react";
import {
  X,
  PencilSimple,
  Flask,
  Warning,
  CurrencyDollar,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const EditProductModal = ({ isOpen, onClose, onRefresh, product }) => {
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    brand: "",
    amount: "",
    unit: "",
    minStockAlert: 5,
    salePrice: 0,
  });

  // Cargar categorías y setear los datos del producto a editar
  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        try {
          const token = localStorage.getItem("sbeltic_token");
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/categories`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const data = await res.json();
          if (data.success) setCategories(data.data);
        } catch (error) {
          toast.error("Error al cargar categorías");
        }
      };
      fetchCategories();

      if (product) {
        setFormData({
          name: product.name || "",
          sku: product.sku || "",
          category: product.category?._id || product.category || "",
          brand: product.brand || "",
          amount: product.amount || "",
          unit: product.unit || "",
          minStockAlert: product.minStockAlert || 5,
          salePrice: product.salePrice || 0,
        });
      }
    }
  }, [isOpen, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${product._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            salePrice: Number(formData.salePrice || 0),
            minStockAlert: Number(formData.minStockAlert),
          }),
        },
      );

      const data = await res.json();
      if (data.success) {
        toast.success("Producto actualizado con éxito");
        onRefresh();
        onClose();
      } else {
        toast.error(data.message || "Error al actualizar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-10005 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <PencilSimple size={24} weight="duotone" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic">
              Editar Producto
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-hide"
        >
          {/* 1. IDENTIFICACIÓN */}
          <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2">
            1. Datos Básicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Nombre del Producto
              </label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Marca
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Categoría
              </label>
              <select
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Seleccionar...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                SKU Interno (No modificable)
              </label>
              <input
                type="text"
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none font-medium text-xs text-slate-400 cursor-not-allowed"
                value={formData.sku}
              />
            </div>
          </div>

          {/* 2. PRESENTACIÓN Y MEDIDA */}
          <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-2 pt-4">
            2. Configuración y Precios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Flask size={14} /> Presentación
              </label>
              <input
                type="text"
                placeholder="Ej: 100 ml"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-indigo-600"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CurrencyDollar size={14} /> Precio Venta
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
                value={formData.salePrice}
                onChange={(e) =>
                  setFormData({ ...formData, salePrice: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Warning size={14} /> Stock Mínimo
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                value={formData.minStockAlert}
                onChange={(e) =>
                  setFormData({ ...formData, minStockAlert: e.target.value })
                }
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-indigo-700 shadow-xl disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Guardando Cambios..." : "Guardar Cambios"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
