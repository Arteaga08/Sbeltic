"use client";
import { useState } from "react";
import {
  X,
  Tag,
  Percent,
  CurrencyDollar,
  CalendarBlank,
  Users,
  UserCircle,
  NotePencil,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useScrollLock } from "@/hooks/useScrollLock";

const INITIAL_STATE = {
  name: "",
  code: "",
  reason: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  expiresAt: "",
  maxRedemptions: 1,
  maxUsesPerUser: 1,
};

const ManualCouponModal = ({ isOpen, patient, onClose, onUpdate }) => {
  useScrollLock(isOpen);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setFormData(INITIAL_STATE);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(formData.expiresAt) <= new Date()) {
      toast.error("La vigencia debe ser una fecha futura");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/coupons/manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: patient._id,
            name: formData.name.trim(),
            code: formData.code.trim().toUpperCase(),
            reason: formData.reason.trim() || undefined,
            discountType: formData.discountType,
            discountValue: Number(formData.discountValue),
            expiresAt: formData.expiresAt,
            maxRedemptions: Number(formData.maxRedemptions),
            maxUsesPerUser: Number(formData.maxUsesPerUser),
          }),
        },
      );

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Cupón creado y asignado al paciente");
        onUpdate?.();
        handleClose();
      } else {
        toast.error(data.message || "Error al crear el cupón");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10010 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Tag size={24} weight="duotone" />
            </div>
            <h2 className="text-xl font-black text-slate-800 uppercase italic">
              Nuevo Cupón Manual
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X size={20} weight="bold" className="text-slate-400" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-8 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-hide"
        >
          {/* 1. IDENTIDAD */}
          <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-100 pb-2">
            1. Identidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Nombre del Cupón
              </label>
              <input
                required
                type="text"
                placeholder="Descuento fidelidad"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Código
              </label>
              <input
                required
                type="text"
                placeholder="FIDELIDAD10"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold uppercase tracking-wider text-indigo-600"
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <NotePencil size={14} /> Motivo (opcional)
            </label>
            <input
              type="text"
              placeholder="Cliente frecuente, cortesía por demora, etc."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
            />
          </div>

          {/* 2. DESCUENTO */}
          <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-100 pb-2 pt-4">
            2. Descuento y Vigencia
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Tipo
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                value={formData.discountType}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value })
                }
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED_AMOUNT">Monto fijo ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {formData.discountType === "PERCENTAGE" ? (
                  <Percent size={14} />
                ) : (
                  <CurrencyDollar size={14} />
                )}
                Valor
              </label>
              <input
                required
                type="number"
                min="1"
                max={formData.discountType === "PERCENTAGE" ? 100 : undefined}
                placeholder={formData.discountType === "PERCENTAGE" ? "10" : "150"}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-indigo-600"
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CalendarBlank size={14} /> Vigencia
              </label>
              <input
                required
                type="date"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData({ ...formData, expiresAt: e.target.value })
                }
              />
            </div>
          </div>

          {/* 3. LÍMITES */}
          <h3 className="text-xs font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-100 pb-2 pt-4">
            3. Límites de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Límite total de canjes
              </label>
              <input
                required
                type="number"
                min="1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                value={formData.maxRedemptions}
                onChange={(e) =>
                  setFormData({ ...formData, maxRedemptions: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UserCircle size={14} /> Usos por paciente
              </label>
              <input
                required
                type="number"
                min="1"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
                value={formData.maxUsesPerUser}
                onChange={(e) =>
                  setFormData({ ...formData, maxUsesPerUser: e.target.value })
                }
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-indigo-700 shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? "Creando..." : "Crear y Asignar Cupón"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualCouponModal;
