"use client";
import { useState } from "react";
import {
  X,
  Archive,
  Hash,
  Calendar,
  Plus,
  CircleNotch,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const NewBatchModal = ({ isOpen, onClose, productId, onRefresh }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchNumber: "",
    initialQuantity: "",
    expiryDate: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/batches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          batchNumber: formData.batchNumber,
          initialQuantity: Number(formData.initialQuantity),
          expiryDate: formData.expiryDate,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Lote ingresado y stock actualizado");
        onRefresh(); // Recarga la lista de lotes y el catálogo
        onClose();
        setFormData({ batchNumber: "", initialQuantity: "", expiryDate: "" });
      } else {
        toast.error(data.message || "Error al registrar el lote");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10005 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-indigo-50 bg-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
              <Archive size={20} weight="bold" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase italic leading-none">
                Ingresar Lote
              </h2>
              <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
                Aumentar inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 tracking-widest">
              <Archive size={14} /> Cantidad (Piezas/Unidades)
            </label>
            <input
              required
              type="number"
              min="1"
              placeholder="Ej: 50"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-indigo-600"
              value={formData.initialQuantity}
              onChange={(e) =>
                setFormData({ ...formData, initialQuantity: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 tracking-widest">
              <Hash size={14} /> Número de Lote / ID
            </label>
            <input
              required
              type="text"
              placeholder="Ej: LOTE-2026-X"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700"
              value={formData.batchNumber}
              onChange={(e) =>
                setFormData({ ...formData, batchNumber: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 tracking-widest">
              <Calendar size={14} /> Fecha de Caducidad
            </label>
            <input
              required
              type="date"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 font-medium"
              value={formData.expiryDate}
              onChange={(e) =>
                setFormData({ ...formData, expiryDate: e.target.value })
              }
            />
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-3.5 mt-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <>
                <Plus size={16} weight="bold" /> Confirmar Ingreso
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewBatchModal;
