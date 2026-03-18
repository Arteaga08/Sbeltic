"use client";
import { useState } from "react";
import {
  X,
  Tag,
  WhatsappLogo,
  MagicWand,
  CalendarBlank,
  Sparkle,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const INITIAL_STATE = {
  code: "",
  type: "WELCOME",
  discountType: "PERCENTAGE",
  discountValue: "",
  expiresAt: "",
  maxRedemptions: "",
  maxUsesPerUser: 1,
  whatsappMessage: "",
  schedule: {
    frequency: "ONCE",
    sendHour: 8,
    dayOfWeek: 1,
    dayOfMonth: 1,
    triggerEvent: "ON_NEW_PATIENT",
    delayDays: 14,
  },
};

// Defaults de schedule por tipo de cupón
const SCHEDULE_DEFAULTS = {
  WELCOME:   { frequency: "AUTO", triggerEvent: "ON_APPOINTMENT_COMPLETE", delayDays: 0  },
  REFERRAL:  { frequency: "AUTO", triggerEvent: "ON_APPOINTMENT_COMPLETE",  delayDays: 14 },
  SEASONAL:  { frequency: "ONCE", triggerEvent: "MANUAL",                   delayDays: 0  },
  CLEARANCE: { frequency: "AUTO", triggerEvent: "ON_LOW_STOCK",             delayDays: 0  },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const CouponBuilderModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState("RULES");

  const setSchedule = (patch) =>
    setFormData((prev) => ({ ...prev, schedule: { ...prev.schedule, ...patch } }));

  const handleTypeChange = (type) => {
    const defaults = SCHEDULE_DEFAULTS[type];
    setFormData((prev) => ({
      ...prev,
      type,
      schedule: { ...prev.schedule, ...defaults },
    }));
    setMobileTab("RULES");
  };

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
    const discountStr = formData.discountValue
      ? formData.discountType === "PERCENTAGE"
        ? `${formData.discountValue}%`
        : `$${formData.discountValue}`
      : "...";
    preview = preview.replace(
      /{{descuento}}/g,
      `<span class="font-black text-indigo-600">${discountStr}</span>`,
    );
    const codeStr =
      formData.code || `<span class="font-black text-indigo-600">[Código]</span>`;
    preview = preview.replace(/{{codigo}}/g, codeStr);
    return preview;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("sbeltic_token");

      const schedulePayload = {
        frequency: formData.schedule.frequency,
        sendHour: Number(formData.schedule.sendHour),
        triggerEvent: formData.schedule.triggerEvent,
        delayDays: Number(formData.schedule.delayDays) || 0,
        ...(formData.schedule.frequency === "WEEKLY" && {
          dayOfWeek: Number(formData.schedule.dayOfWeek),
        }),
        ...(formData.schedule.frequency === "MONTHLY" && {
          dayOfMonth: Number(formData.schedule.dayOfMonth),
        }),
      };

      const payload = {
        code: formData.code,
        type: formData.type,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        expiresAt: formData.expiresAt,
        whatsappMessageTemplate: formData.whatsappMessage,
        maxRedemptions: Number(formData.maxRedemptions) || 100,
        maxUsesPerUser: Number(formData.maxUsesPerUser) || 1,
        schedule: schedulePayload,
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok || data.success) {
        toast.success("¡Campaña guardada en la base de datos!");
        if (onRefresh) onRefresh();
        setFormData(INITIAL_STATE);
        onClose();
      } else {
        toast.error(data.message || "Error al crear la campaña");
      }
    } catch (error) {
      console.error("Error en POST Coupon:", error);
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isAutoSchedule = ["WELCOME", "CLEARANCE"].includes(formData.type);

  return (
    <div
      className="fixed inset-0 z-10001 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-white rounded-t-4xl sm:rounded-3xl shadow-2xl flex flex-col h-[90dvh] sm:h-auto sm:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="px-5 py-4 md:px-10 md:py-8 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl">
              <MagicWand size={20} weight="fill" className="md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black italic uppercase text-slate-900 leading-none tracking-tight">
                Campaña
              </h2>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
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

        {/* TABS MÓVIL */}
        <div className="flex md:hidden border-b border-slate-100 bg-slate-50/50 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("RULES")}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${mobileTab === "RULES" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-400"}`}
          >
            <Tag size={16} /> Params
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("WHATSAPP")}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${mobileTab === "WHATSAPP" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-400"}`}
          >
            <WhatsappLogo size={16} /> Difusión
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("SCHEDULE")}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${mobileTab === "SCHEDULE" ? "bg-white text-violet-600 shadow-sm border border-slate-200" : "text-slate-400"}`}
          >
            <CalendarBlank size={16} /> Envío
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/30 p-5 md:p-10">
          <form
            id="couponForm"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* FILA 1: Parámetros + WhatsApp (2 columnas en desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
              {/* COLUMNA IZQUIERDA: Parámetros */}
              <div className={`${mobileTab === "RULES" ? "block" : "hidden"} md:block space-y-5 md:space-y-6 animate-in fade-in duration-300`}>
                <h3 className="hidden md:flex text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] items-center gap-2 border-b border-slate-100 pb-2">
                  <Tag size={16} /> 1. Parámetros
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Objetivo Estratégico
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
                    >
                      <option value="WELCOME">Bienvenida (1ra Visita)</option>
                      <option value="REFERRAL">Programa de Referidos</option>
                      <option value="SEASONAL">Promoción de Temporada</option>
                      <option value="CLEARANCE">Liquidación de Inventario</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Código
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. VERANO"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value.toUpperCase() })
                        }
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-black uppercase outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Valor
                      </label>
                      <div className="flex border border-slate-100 rounded-2xl overflow-hidden bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                        <select
                          value={formData.discountType}
                          onChange={(e) =>
                            setFormData({ ...formData, discountType: e.target.value })
                          }
                          className="bg-slate-50 text-[11px] font-black p-4 outline-none border-r border-slate-100 text-slate-600 appearance-none"
                        >
                          <option value="PERCENTAGE">%</option>
                          <option value="FIXED_AMOUNT">$</option>
                        </select>
                        <input
                          type="number"
                          placeholder="0"
                          value={formData.discountValue}
                          onChange={(e) =>
                            setFormData({ ...formData, discountValue: e.target.value })
                          }
                          className="w-full p-4 bg-transparent text-base md:text-sm font-black outline-none"
                          required
                          min="1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Vigencia
                    </label>
                    <div className="flex items-center bg-white border border-slate-100 rounded-2xl px-4 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                      <CalendarBlank size={16} className="text-slate-400 shrink-0" />
                      <input
                        type="date"
                        value={formData.expiresAt}
                        onChange={(e) =>
                          setFormData({ ...formData, expiresAt: e.target.value })
                        }
                        className="w-full p-4 bg-transparent text-base md:text-sm font-bold text-slate-700 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: WhatsApp */}
              <div className={`${mobileTab === "WHATSAPP" ? "block" : "hidden"} md:block space-y-5 md:space-y-6 animate-in fade-in duration-300`}>
                <h3 className="hidden md:flex text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] items-center gap-2 border-b border-slate-100 pb-2">
                  <WhatsappLogo size={16} className="text-emerald-500" /> 2. Difusión
                </h3>

                <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm">
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Cuerpo del Mensaje
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-3 p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                    {["nombre", "descuento", "codigo"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => insertVariable(v)}
                        className="px-2 py-1.5 bg-white border border-slate-100 text-indigo-700 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-indigo-50"
                      >
                        + {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows="3"
                    placeholder="Redacta el mensaje..."
                    value={formData.whatsappMessage}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsappMessage: e.target.value })
                    }
                    className="w-full p-4 bg-slate-50/50 border border-slate-100 rounded-2xl text-base md:text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 resize-none leading-relaxed"
                  />
                </div>

                <div className="pb-4 md:pb-0">
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 text-center">
                    Previsualización
                  </label>
                  <div className="bg-[#EFEAE2] p-4 rounded-4xl shadow-inner max-w-sm mx-auto border-[3px] border-white/50">
                    {formData.whatsappMessage ? (
                      <div className="bg-[#d9fdd3] text-[#111b21] p-3 rounded-xl rounded-tr-none shadow-sm text-xs inline-block max-w-[90%] float-right">
                        <p
                          className="whitespace-pre-wrap leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: generatePreview() }}
                        />
                        <span className="text-[9px] text-slate-400 float-right mt-1 ml-2">
                          12:00 PM
                        </span>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 italic text-xs">
                        Empieza a escribir...
                      </div>
                    )}
                    <div className="clear-both" />
                  </div>
                </div>
              </div>
            </div>

            {/* FILA 2: Programación (full width en desktop, tab en móvil) */}
            <div className={`${mobileTab === "SCHEDULE" ? "block" : "hidden"} md:block animate-in fade-in duration-300`}>
              <h3 className="hidden md:flex text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] items-center gap-2 border-b border-slate-100 pb-2 mb-6">
                <Sparkle size={16} className="text-violet-500" /> 3. Programación de Envío
              </h3>

              {/* WELCOME y CLEARANCE: automáticos, solo informativo */}
              {isAutoSchedule ? (
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex items-start gap-4">
                  <div className="p-3 bg-violet-100 text-violet-600 rounded-xl shrink-0">
                    <Sparkle size={20} weight="fill" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-violet-700 uppercase tracking-widest mb-1">
                      Envío Automático
                    </p>
                    <p className="text-xs text-violet-600 leading-relaxed">
                      {formData.type === "WELCOME"
                        ? "Este cupón se enviará automáticamente cada vez que se registre un paciente nuevo."
                        : "Este cupón se activará automáticamente cuando un producto vinculado llegue a stock crítico."}
                    </p>
                  </div>
                </div>
              ) : formData.type === "REFERRAL" ? (
                /* REFERRAL: configurable solo el delay */
                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-4 mb-2">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                      <Sparkle size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">
                        Envío Automático Post-Cita
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Se enviará N días después de que el paciente complete su primera cita.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Días de espera después de la cita
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={formData.schedule.delayDays}
                      onChange={(e) => setSchedule({ delayDays: e.target.value })}
                      className="w-32 p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-black text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              ) : (
                /* SEASONAL: configuración completa */
                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5">
                  {/* Frecuencia */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Frecuencia
                    </label>
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { value: "ONCE", label: "Una vez" },
                        { value: "WEEKLY", label: "Semanal" },
                        { value: "MONTHLY", label: "Mensual" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSchedule({ frequency: opt.value })}
                          className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            formData.schedule.frequency === opt.value
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                              : "bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Hora de envío */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Hora de Envío
                      </label>
                      <select
                        value={formData.schedule.sendHour}
                        onChange={(e) => setSchedule({ sendHour: Number(e.target.value) })}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
                      >
                        {HOURS.map((h) => (
                          <option key={h} value={h}>
                            {String(h).padStart(2, "0")}:00
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Día de la semana (WEEKLY) */}
                    {formData.schedule.frequency === "WEEKLY" && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                          Día de la Semana
                        </label>
                        <select
                          value={formData.schedule.dayOfWeek}
                          onChange={(e) => setSchedule({ dayOfWeek: Number(e.target.value) })}
                          className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
                        >
                          {DAYS_OF_WEEK.map((d, i) => (
                            <option key={i} value={i}>{d}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Día del mes (MONTHLY) */}
                    {formData.schedule.frequency === "MONTHLY" && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                          Día del Mes
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.schedule.dayOfMonth}
                          onChange={(e) => setSchedule({ dayOfMonth: Number(e.target.value) })}
                          className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <footer className="px-5 py-4 md:px-10 md:py-6 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200"
          >
            Cancelar
          </button>

          <div className="w-full sm:w-auto flex gap-3">
            {/* Botón "Siguiente" móvil */}
            {mobileTab === "RULES" && (
              <button
                type="button"
                onClick={() => setMobileTab("WHATSAPP")}
                className="md:hidden flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Siguiente ➔
              </button>
            )}
            {mobileTab === "WHATSAPP" && (
              <button
                type="button"
                onClick={() => setMobileTab("SCHEDULE")}
                className="md:hidden flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Programar ➔
              </button>
            )}

            <button
              type="submit"
              form="couponForm"
              disabled={
                isSubmitting ||
                !formData.code ||
                !formData.expiresAt ||
                !formData.whatsappMessage
              }
              className={`flex-1 sm:w-auto px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50 ${
                mobileTab === "SCHEDULE" ? "block" : "hidden md:block"
              }`}
            >
              {isSubmitting ? "Guardando..." : "Crear Campaña"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CouponBuilderModal;
