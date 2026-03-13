"use client";
import { useState, useEffect, useRef } from "react";
import {
  X,
  Package,
  Tag,
  Hash,
  Scales,
  Warning,
  CurrencyDollar,
  Info,
  CheckCircle,
  DownloadSimple,
  Drop,
  Flask,
  Calendar,
  Archive,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";

// Opciones de unidades médicas para el selector
const UNIT_OPTIONS = [
  { value: "ml", label: "ml (Mililitros)" },
  { value: "pza", label: "pza (Piezas)" },
  { value: "viales", label: "viales" },
  { value: "u", label: "U (Unidades)" },
  { value: "mg", label: "mg (Miligramos)" },
  { value: "caja", label: "caja" },
  { value: "amp", label: "amp (Ampolletas)" },
];

const INITIAL_STATE = {
  name: "",
  sku: "",
  category: "",
  brand: "",
  amount: "", // El número (ej: 100)
  unit: "ml", // El selector (ej: ml)
  minStockAlert: 5,
  isTrackable: true,
  salePrice: "",
  initialQuantity: "",
  batchNumber: "",
  expirationDate: "",
};

const NewProductModal = ({ isOpen, onClose, onRefresh }) => {
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  const qrRef = useRef();
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSkuTouched, setIsSkuTouched] = useState(false);

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
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormData(INITIAL_STATE);
    setCreatedProduct(null);
    setIsSkuTouched(false);
    onClose();
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    if (!isSkuTouched) {
      const autoSku = newName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      setFormData({ ...formData, name: newName, sku: autoSku });
    } else {
      setFormData({ ...formData, name: newName });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalSku =
      formData.sku ||
      formData.name.substring(0, 4).toLowerCase() +
        "-" +
        Math.floor(Math.random() * 1000);

    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          sku: finalSku,
          // Unimos el número y la unidad para el campo 'amount' de la BD si es necesario,
          // o mandamos la unidad seleccionada al campo 'unit'.
          salePrice: Number(formData.salePrice || 0),
          minStockAlert: Number(formData.minStockAlert),
          initialQuantity: Number(formData.initialQuantity || 0),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Producto creado con éxito");
        onRefresh();
        setCreatedProduct({ name: formData.name, sku: finalSku });
      } else {
        toast.error(data.message || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package size={24} weight="duotone" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic">
              {createdProduct ? "Registro Completo" : "Nuevo Producto"}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X size={20} weight="bold" className="text-slate-400" />
          </button>
        </div>

        {createdProduct ? (
          <div className="p-10 flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={32} weight="fill" />
            </div>
            <h3 className="text-2xl font-black text-slate-800">
              {createdProduct.name}
            </h3>
            {/* 🌟 REFERENCIA PARA DESCARGA */}
            <div
              ref={qrRef}
              className="p-6 bg-white border-2 border-slate-100 rounded-3xl shadow-sm"
            >
              <QRCodeCanvas value={createdProduct.sku} size={180} />
            </div>
            <div className="flex gap-4 w-full max-w-sm">
              <button
                onClick={() => {
                  const canvas = qrRef.current.querySelector("canvas");
                  const link = document.createElement("a");
                  link.href = canvas.toDataURL("image/png");
                  link.download = `QR_${createdProduct.sku}.png`;
                  link.click();
                }}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <DownloadSimple size={20} weight="bold" /> Descargar
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-8 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-hide"
          >
            {/* 1. IDENTIFICACIÓN */}
            <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-100 pb-2">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Marca
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
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
                  SKU Interno
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-xs"
                  value={formData.sku}
                  onChange={(e) => {
                    setIsSkuTouched(true);
                    setFormData({
                      ...formData,
                      sku: e.target.value.toLowerCase(),
                    });
                  }}
                />
              </div>
            </div>

            {/* 2. PRESENTACIÓN (COMBINADO) */}
            {/* 2. PRESENTACIÓN Y MEDIDA */}
            <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-100 pb-2 pt-4">
              2. Presentación y Medida
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* COLUMNA 1: CONTENIDO NETO (Ya no es col-span-2) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Flask size={14} /> Contenido Neto
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="100"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-indigo-600 w-full"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                  />
                  <select
                    className="w-20 px-2 py-3 bg-indigo-50 border border-indigo-100 rounded-xl outline-none font-bold text-indigo-600 appearance-none cursor-pointer text-xs"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                  >
                    {UNIT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* COLUMNA 2: PRECIO DE VENTA (NUEVO) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CurrencyDollar size={14} /> Precio Venta
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                  value={formData.salePrice}
                  onChange={(e) =>
                    setFormData({ ...formData, salePrice: e.target.value })
                  }
                />
              </div>

              {/* COLUMNA 3: STOCK MÍNIMO */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Warning size={14} /> Stock Mínimo
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  value={formData.minStockAlert}
                  onChange={(e) =>
                    setFormData({ ...formData, minStockAlert: e.target.value })
                  }
                />
              </div>
            </div>

            {/* 3. STOCK INICIAL */}
            <h3 className="text-xs font-black uppercase text-rose-500 tracking-widest border-b border-rose-100 pb-2 pt-4">
              3. Ingreso Inicial (Opcional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-rose-50/30 border border-rose-100 rounded-2xl">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Piezas/Cajas
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl outline-none"
                  value={formData.initialQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialQuantity: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  # Lote
                </label>
                <input
                  type="text"
                  placeholder="L-2026"
                  className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl outline-none"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, batchNumber: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Vencimiento
                </label>
                <input
                  required={formData.initialQuantity > 0}
                  type="date"
                  className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl outline-none text-xs"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDate: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-indigo-700 shadow-xl disabled:opacity-50"
            >
              {isSubmitting ? "Registrando..." : "Confirmar Producto"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewProductModal;
