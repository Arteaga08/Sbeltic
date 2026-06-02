"use client";
import { useState, useEffect } from "react";
import {
  X,
  UsersThree,
  Tag,
  Percent,
  CurrencyDollar,
  CalendarBlank,
  Users,
  UserCircle,
  NotePencil,
  MagnifyingGlass,
  Check,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useScrollLock } from "@/hooks/useScrollLock";

const API = process.env.NEXT_PUBLIC_API_URL;

const INITIAL_STATE = {
  name: "",
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  rewardType: "PERCENTAGE",
  rewardValue: "",
  expiresAt: "",
  maxRedemptions: 1,
  maxUsesPerUser: 1,
};

const ReferralCouponModal = ({ isOpen, onClose, onUpdate }) => {
  useScrollLock(isOpen);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dueño del referido (recibe la recompensa)
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState([]);
  const [owner, setOwner] = useState(null);

  // Buscar dueño (debounce)
  useEffect(() => {
    if (owner || !ownerSearch.trim()) {
      setOwnerResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetchWithAuth(
          `${API}/patients?search=${encodeURIComponent(ownerSearch)}&limit=6`,
        );
        const data = await res.json();
        setOwnerResults(data.data?.patients || []);
      } catch {
        setOwnerResults([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [ownerSearch, owner]);

  const resetState = () => {
    setFormData(INITIAL_STATE);
    setOwnerSearch("");
    setOwnerResults([]);
    setOwner(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!owner) {
      toast.error("Selecciona el paciente dueño del referido");
      return;
    }
    if (new Date(formData.expiresAt) <= new Date()) {
      toast.error("La vigencia debe ser una fecha futura");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API}/coupons/referral`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: owner._id,
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          description: formData.description.trim(),
          discountType: formData.discountType,
          discountValue: Number(formData.discountValue),
          rewardType: formData.rewardType,
          rewardValue: Number(formData.rewardValue),
          expiresAt: formData.expiresAt,
          maxRedemptions: Number(formData.maxRedemptions),
          maxUsesPerUser: Number(formData.maxUsesPerUser),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Cupón de referido creado");
        onUpdate?.();
        handleClose();
      } else {
        toast.error(data.message || "Error al crear el referido");
      }
    } catch {
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
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <UsersThree size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic">
                Nuevo Referido
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Cupón global y compartible
              </p>
            </div>
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
          {/* 1. DUEÑO */}
          <h3 className="text-xs font-black uppercase text-purple-600 tracking-widest border-b border-purple-100 pb-2">
            1. Dueño del referido
          </h3>
          <div className="space-y-3">
            <p className="text-[10px] font-medium text-slate-500">
              La recompensa se entrega automáticamente a este paciente cuando
              alguien canjee el cupón en finanzas.
            </p>
            {owner ? (
              <div className="flex items-center justify-between bg-white border border-purple-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Check size={16} weight="bold" className="text-emerald-500" />
                  <span className="text-sm font-bold text-slate-700">
                    {owner.name}
                  </span>
                  {owner.phone && (
                    <span className="text-[10px] text-slate-400">
                      {owner.phone}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOwner(null);
                    setOwnerSearch("");
                  }}
                  className="text-[10px] font-black uppercase text-rose-500 tracking-widest"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3">
                  <MagnifyingGlass size={16} className="text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Buscar paciente por nombre o teléfono..."
                    className="w-full px-3 py-3 bg-transparent outline-none text-sm font-medium"
                    value={ownerSearch}
                    onChange={(e) => setOwnerSearch(e.target.value)}
                  />
                </div>
                {ownerResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                    {ownerResults.map((p) => (
                      <button
                        type="button"
                        key={p._id}
                        onClick={() => {
                          setOwner(p);
                          setOwnerResults([]);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-slate-50 last:border-0"
                      >
                        <p className="text-sm font-bold text-slate-700">{p.name}</p>
                        {p.phone && (
                          <p className="text-[10px] text-slate-400">{p.phone}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. IDENTIDAD */}
          <h3 className="text-xs font-black uppercase text-purple-600 tracking-widest border-b border-purple-100 pb-2 pt-4">
            2. Identidad
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Nombre del Cupón
              </label>
              <input
                required
                type="text"
                placeholder="Referido de Ana"
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
                placeholder="ANAREF"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold uppercase tracking-wider text-purple-600"
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
              <NotePencil size={14} /> Descripción corta
            </label>
            <input
              required
              type="text"
              placeholder="Comparte y obtén un descuento"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* 3. DESCUENTO */}
          <h3 className="text-xs font-black uppercase text-purple-600 tracking-widest border-b border-purple-100 pb-2 pt-4">
            3. Descuento y Vigencia
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-purple-600"
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

          {/* 4. RECOMPENSA PARA EL DUEÑO */}
          <h3 className="text-xs font-black uppercase text-purple-600 tracking-widest border-b border-purple-100 pb-2 pt-4">
            4. Recompensa para el dueño
          </h3>
          <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-4">
            <p className="text-[10px] font-medium text-slate-500">
              Lo que recibe el dueño en su cartera cada vez que alguien canjea su
              cupón. Es independiente del descuento que recibe quien lo usa.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tipo de recompensa
                </label>
                <select
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-medium"
                  value={formData.rewardType}
                  onChange={(e) =>
                    setFormData({ ...formData, rewardType: e.target.value })
                  }
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED_AMOUNT">Monto fijo ($)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  {formData.rewardType === "PERCENTAGE" ? (
                    <Percent size={14} />
                  ) : (
                    <CurrencyDollar size={14} />
                  )}
                  Valor de la recompensa
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max={formData.rewardType === "PERCENTAGE" ? 100 : undefined}
                  placeholder={formData.rewardType === "PERCENTAGE" ? "10" : "150"}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-purple-600"
                  value={formData.rewardValue}
                  onChange={(e) =>
                    setFormData({ ...formData, rewardValue: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* 5. LÍMITES */}
          <h3 className="text-xs font-black uppercase text-purple-600 tracking-widest border-b border-purple-100 pb-2 pt-4">
            5. Límites de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={14} /> Canjes totales (amigas referidas)
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
            className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-purple-700 shadow-xl disabled:opacity-50"
          >
            {isSubmitting ? "Creando..." : "Crear Referido"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReferralCouponModal;
