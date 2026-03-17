"use client";
import { useState } from "react";
import {
  X,
  Tag,
  WhatsappLogo,
  MagicWand,
  CalendarBlank,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const INITIAL_STATE = {
  code: "",
  type: "WELCOME",
  discountType: "PERCENTAGE",
  discountValue: "",
  expiresAt: "",
  minPurchase: 0,
  maxRedemptions: "",
  maxUsesPerUser: 1,
  whatsappMessage: "",
};

const CouponBuilderModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insertVariable = (variable) => {
    setFormData((prev) => ({
      ...prev,
      whatsappMessage: prev.whatsappMessage + ` {{${variable}}}`,
    }));
  };

  const generatePreview = () => {
    if (!formData.whatsappMessage) return "";
    let preview = formData.whatsappMessage;
    preview = preview.replace(
      /{{nombre}}/g,
      `<span class="font-black text-indigo-600">[Nombre]</span>`,
    );

    let discountStr = "...";
    if (formData.discountValue) {
      discountStr =
        formData.discountType === "PERCENTAGE"
          ? `${formData.discountValue}%`
          : `$${formData.discountValue}`;
    }
    preview = preview.replace(
      /{{descuento}}/g,
      `<span class="font-black text-indigo-600">${discountStr}</span>`,
    );

    const codeStr =
      formData.code ||
      `<span class="font-black text-indigo-600">[Código]</span>`;
    preview = preview.replace(/{{codigo}}/g, codeStr);

    return preview;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Campaña creada exitosamente");
      setIsSubmitting(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-end md:items-center justify-center p-0 md:p-6 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 🌟 CONTENEDOR PRINCIPAL: Altura dinámica (dvh) para móvil, auto para desktop */}
      <div className="relative w-full max-w-5xl bg-white rounded-t-4xl md:rounded-[3rem] shadow-2xl flex flex-col h-[90dvh] md:h-auto md:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom md:zoom-in-95 duration-400">
        {/* 🌟 HEADER: Más compacto en móvil */}
        <header className="px-5 py-4 md:px-10 md:py-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl">
              <MagicWand size={20} weight="fill" className="md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black italic uppercase text-slate-900 leading-none tracking-tight">
                Campaña
              </h2>
              <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Sbeltic Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </header>

        {/* 🌟 BODY: Paddings reducidos en móvil (p-5 en lugar de p-10) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/30 p-5 md:p-10">
          <form
            id="couponForm"
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12"
          >
            {/* COLUMNA IZQUIERDA: Reglas */}
            <div className="space-y-5 md:space-y-8">
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
                <Tag size={16} /> 1. Parámetros
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Objetivo Estratégico
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full p-3 md:p-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
                  >
                    <option value="WELCOME">Bienvenida (1ra Visita)</option>
                    <option value="REFERRAL">Programa de Referidos</option>
                    <option value="SEASONAL">Promoción de Temporada</option>
                    <option value="CLEARANCE">Liquidación de Inventario</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Código
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. VERANO"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full p-3 md:p-4 bg-white border border-slate-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-black uppercase outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Valor
                    </label>
                    <div className="flex border border-slate-100 rounded-xl md:rounded-2xl overflow-hidden bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                      <select
                        value={formData.discountType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountType: e.target.value,
                          })
                        }
                        className="bg-slate-50 text-[10px] md:text-[11px] font-black p-3 md:p-4 outline-none border-r border-slate-100 text-slate-600 appearance-none"
                      >
                        <option value="PERCENTAGE">%</option>
                        <option value="FIXED_AMOUNT">$</option>
                      </select>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.discountValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountValue: e.target.value,
                          })
                        }
                        className="w-full p-3 md:p-4 bg-transparent text-xs md:text-sm font-black outline-none"
                        required
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Vigencia
                  </label>
                  <div className="flex items-center bg-white border border-slate-100 rounded-xl md:rounded-2xl px-3 md:px-4 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                    <CalendarBlank
                      size={16}
                      className="text-slate-400 shrink-0"
                    />
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                      className="w-full p-3 md:p-4 bg-transparent text-xs md:text-sm font-bold text-slate-700 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: WhatsApp */}
            <div className="space-y-5 md:space-y-8">
              <h3 className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-slate-100 pb-2">
                <WhatsappLogo size={16} className="text-emerald-500" /> 2.
                Difusión
              </h3>

              <div className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-4 shadow-sm">
                <label className="block text-[8px] md:text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Cuerpo del Mensaje
                </label>

                <div className="flex flex-wrap gap-1.5 mb-3 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <button
                    type="button"
                    onClick={() => insertVariable("nombre")}
                    className="px-2 py-1.5 bg-white border border-slate-100 text-indigo-700 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50"
                  >
                    + Nombre
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("descuento")}
                    className="px-2 py-1.5 bg-white border border-slate-100 text-indigo-700 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50"
                  >
                    + Descuento
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable("codigo")}
                    className="px-2 py-1.5 bg-white border border-slate-100 text-indigo-700 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50"
                  >
                    + Código
                  </button>
                </div>

                <textarea
                  rows="3"
                  placeholder="Redacta el mensaje..."
                  value={formData.whatsappMessage}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsappMessage: e.target.value,
                    })
                  }
                  className="w-full p-3 md:p-4 bg-slate-50/50 border border-slate-100 rounded-xl text-xs text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 resize-none leading-relaxed"
                />
              </div>

              {/* Vista Previa */}
              <div className="pb-4 md:pb-0">
                <label className="block text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">
                  Previsualización Móvil
                </label>
                <div className="bg-[#EFEAE2] p-3 md:p-5 rounded-2xl md:rounded-4xl shadow-inner relative max-w-sm mx-auto border-[3px] border-white/50">
                  {formData.whatsappMessage ? (
                    <div className="bg-[#d9fdd3] text-[#111b21] p-2.5 md:p-3.5 rounded-xl rounded-tr-none shadow-sm text-[11px] md:text-sm inline-block relative max-w-[90%] float-right">
                      <p
                        className="whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: generatePreview() }}
                      />
                      <span className="text-[8px] md:text-[10px] text-slate-400 float-right mt-1 ml-2">
                        12:00 PM
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-400 italic text-[10px] md:text-xs">
                      Empieza a escribir...
                    </div>
                  )}
                  <div className="clear-both"></div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* 🌟 FOOTER: Botones apilados en móvil para fácil acceso */}
        <footer className="px-5 py-4 md:px-10 md:py-6 border-t border-slate-100 bg-white flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-4 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 text-slate-600 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="couponForm"
            disabled={
              isSubmitting ||
              !formData.code ||
              !formData.expiresAt ||
              !formData.whatsappMessage
            }
            className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            {isSubmitting ? "Guardando..." : "Crear Campaña"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CouponBuilderModal;
