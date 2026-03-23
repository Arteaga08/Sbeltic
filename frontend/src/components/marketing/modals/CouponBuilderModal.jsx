"use client";
import { useState, useEffect } from "react";
import {
  X,
  Tag,
  WhatsappLogo,
  MagicWand,
  CalendarBlank,
  Sparkle,
} from "@phosphor-icons/react";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL;

const TEMPLATE_MAP = {
  WELCOME: "sbeltic_bienvenida",
  REFERRAL: "sbeltic_referidos",
  MAINTENANCE: "sbeltic_mantenimiento",
  BIRTHDAY: "sbeltic_cumple",
  SEASONAL: "sbeltic_promo_mensual",
  CLEARANCE: "sbeltic_liquidacion",
};

const TEMPLATE_PREVIEWS = {
  WELCOME:
    "Hola {{nombre}}, notamos tu interes en Sbeltic. Queremos consentirte en tu primera visita: Aqui tienes un cupon del {{descuento}} de descuento. Usa el codigo {{codigo}} al agendar.",
  REFERRAL:
    "Gracias por tu visita a Sbeltic, {{nombre}}! Regalale a tus amigas {{descuento}} de descuento en su primera cita compartiendo tu codigo: {{codigo}}. Por cada amiga que lo use, tu ganaras {{recompensa}} en tu cuenta!",
  MAINTENANCE:
    "Hola {{nombre}}, han pasado {{tiempo_transcurrido}} desde tu tratamiento de {{tratamiento}}. Es el momento ideal para tu sesion de mantenimiento. Agenda esta semana y recibe {{descuento}} de descuento.",
  BIRTHDAY:
    "Feliz cumpleanos, {{nombre}}! {{mensaje_personalizado}} Como regalo, te enviamos {{regalo}}. Usa el codigo {{codigo}} al agendar. Dejanos consentirte!",
  SEASONAL:
    "Hola {{nombre}}. Tenemos una sorpresa para tu rutina de skincare. Llevate el {{producto}} con un {{descuento}} de descuento. Pidelo usando el codigo {{codigo}}.",
  CLEARANCE:
    "Hola {{nombre}}. Tenemos una sorpresa para tu rutina de skincare. Llevate el {{producto}} con un {{descuento}} de descuento. Solo nos quedan pocas piezas. Pidelo usando el codigo {{codigo}}.",
};

const INITIAL_STATE = {
  code: "",
  type: "WELCOME",
  discountType: "PERCENTAGE",
  discountValue: "",
  expiresAt: "",
  maxRedemptions: "",
  maxUsesPerUser: 1,
  // Campos específicos por tipo
  templateVariables: {
    recompensa: "",
    producto: "",
    regalo: "",
    mensajePersonalizado: "",
    daysBeforeBirthday: 0,
  },
  maintenanceConfig: {
    treatmentId: "",
    touchUpDays: "",
  },
  schedule: {
    frequency: "ONCE",
    sendHour: 8,
    dayOfWeek: 1,
    dayOfMonth: 1,
    triggerEvent: "ON_NEW_PATIENT",
    delayDays: 14,
  },
};

const SCHEDULE_DEFAULTS = {
  WELCOME: { frequency: "AUTO", triggerEvent: "ON_APPOINTMENT_COMPLETE", delayDays: 0 },
  REFERRAL: { frequency: "AUTO", triggerEvent: "ON_APPOINTMENT_COMPLETE", delayDays: 14 },
  SEASONAL: { frequency: "ONCE", triggerEvent: "MANUAL", delayDays: 0 },
  CLEARANCE: { frequency: "AUTO", triggerEvent: "ON_LOW_STOCK", delayDays: 0 },
  BIRTHDAY: { frequency: "AUTO", triggerEvent: "ON_BIRTHDAY", delayDays: 0 },
  MAINTENANCE: { frequency: "AUTO", triggerEvent: "ON_MAINTENANCE_DUE", delayDays: 0 },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function getToken() {
  if (typeof window !== "undefined") return localStorage.getItem("sbeltic_token");
  return null;
}

const CouponBuilderModal = ({ isOpen, onClose, onRefresh }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState("RULES");
  const [treatments, setTreatments] = useState([]);
  const [products, setProducts] = useState([]);

  // Cargar tratamientos y productos al abrir
  useEffect(() => {
    if (!isOpen) return;
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API}/treatments?limit=200`, { headers })
      .then((r) => r.json())
      .then((data) => {
        const list = data.data?.results ?? data.data ?? data.results ?? data;
        setTreatments(Array.isArray(list) ? list : []);
      })
      .catch(() => {});

    fetch(`${API}/products?limit=200`, { headers })
      .then((r) => r.json())
      .then((data) => {
        const list = data.data?.results ?? data.data ?? data.results ?? data;
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [isOpen]);

  const setSchedule = (patch) =>
    setFormData((prev) => ({
      ...prev,
      schedule: { ...prev.schedule, ...patch },
    }));

  const setTemplateVar = (key, value) =>
    setFormData((prev) => ({
      ...prev,
      templateVariables: { ...prev.templateVariables, [key]: value },
    }));

  const setMaintenanceConfig = (patch) =>
    setFormData((prev) => ({
      ...prev,
      maintenanceConfig: { ...prev.maintenanceConfig, ...patch },
    }));

  const handleTypeChange = (type) => {
    const defaults = SCHEDULE_DEFAULTS[type];
    setFormData((prev) => ({
      ...prev,
      type,
      schedule: { ...prev.schedule, ...defaults },
    }));
    setMobileTab("RULES");
  };

  const handleTreatmentSelect = (treatmentId) => {
    const treatment = treatments.find((t) => t._id === treatmentId);
    setMaintenanceConfig({
      treatmentId,
      touchUpDays: treatment?.suggestedTouchUpDays || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = getToken();
      const templateName = TEMPLATE_MAP[formData.type];

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
        whatsappTemplateName: templateName,
        maxRedemptions: Number(formData.maxRedemptions) || 100,
        maxUsesPerUser: Number(formData.maxUsesPerUser) || 1,
        schedule: schedulePayload,
      };

      // Agregar templateVariables según tipo
      const tv = formData.templateVariables;
      if (formData.type === "REFERRAL" && tv.recompensa) {
        payload.templateVariables = { recompensa: tv.recompensa };
      }
      if (formData.type === "BIRTHDAY") {
        payload.templateVariables = {
          regalo: tv.regalo,
          mensajePersonalizado: tv.mensajePersonalizado,
          daysBeforeBirthday: Number(tv.daysBeforeBirthday) || 0,
        };
      }
      if (formData.type === "SEASONAL" && tv.producto) {
        payload.templateVariables = { producto: tv.producto };
      }
      if (formData.type === "CLEARANCE") {
        payload.templateVariables = { producto: tv.producto };
        if (formData.clearanceProducts?.length) {
          payload.clearanceConfig = { applicableProducts: formData.clearanceProducts };
        }
      }
      if (formData.type === "MAINTENANCE" && formData.maintenanceConfig.treatmentId) {
        payload.maintenanceConfig = {
          treatmentId: formData.maintenanceConfig.treatmentId,
          ...(formData.maintenanceConfig.touchUpDays && {
            touchUpDays: Number(formData.maintenanceConfig.touchUpDays),
          }),
        };
      }

      const res = await fetch(`${API}/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok || data.success) {
        toast.success("Campana guardada!");
        if (onRefresh) onRefresh();
        setFormData(INITIAL_STATE);
        onClose();
      } else {
        toast.error(data.message || "Error al crear la campana");
      }
    } catch (error) {
      console.error("Error en POST Coupon:", error);
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isAutoSchedule = ["WELCOME", "CLEARANCE", "BIRTHDAY", "MAINTENANCE"].includes(formData.type);

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
                Campana
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

        {/* TABS MOVIL */}
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
            onClick={() => setMobileTab("CONFIG")}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${mobileTab === "CONFIG" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-400"}`}
          >
            <WhatsappLogo size={16} /> Plantilla
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("SCHEDULE")}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 ${mobileTab === "SCHEDULE" ? "bg-white text-violet-600 shadow-sm border border-slate-200" : "text-slate-400"}`}
          >
            <CalendarBlank size={16} /> Envio
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/30 p-5 md:p-10">
          <form id="couponForm" onSubmit={handleSubmit} className="space-y-8">
            {/* FILA 1: Parametros + Plantilla/Config (2 columnas en desktop) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
              {/* COLUMNA IZQUIERDA: Parametros */}
              <div
                className={`${mobileTab === "RULES" ? "block" : "hidden"} md:block space-y-5 md:space-y-6 animate-in fade-in duration-300`}
              >
                <h3 className="hidden md:flex text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] items-center gap-2 border-b border-slate-100 pb-2">
                  <Tag size={16} /> 1. Parametros
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Objetivo Estrategico
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleTypeChange(e.target.value)}
                      className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
                    >
                      <option value="WELCOME">Bienvenida (1ra Visita)</option>
                      <option value="REFERRAL">Programa de Referidos</option>
                      <option value="SEASONAL">Promocion Mensual</option>
                      <option value="CLEARANCE">Liquidacion de Inventario</option>
                      <option value="BIRTHDAY">Cumpleanos</option>
                      <option value="MAINTENANCE">Mantenimiento / Retoque</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Codigo
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
                            setFormData({
                              ...formData,
                              discountType: e.target.value,
                            })
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
                            setFormData({
                              ...formData,
                              discountValue: e.target.value,
                            })
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

              {/* COLUMNA DERECHA: Plantilla + Configuracion por tipo */}
              <div
                className={`${mobileTab === "CONFIG" ? "block" : "hidden"} md:block space-y-5 md:space-y-6 animate-in fade-in duration-300`}
              >
                <h3 className="hidden md:flex text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] items-center gap-2 border-b border-slate-100 pb-2">
                  <WhatsappLogo size={16} className="text-emerald-500" /> 2. Plantilla & Config
                </h3>

                {/* Preview de la plantilla Meta (read-only) */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <WhatsappLogo size={16} weight="fill" className="text-emerald-600" />
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                      Plantilla Meta: {TEMPLATE_MAP[formData.type]}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {TEMPLATE_PREVIEWS[formData.type]}
                  </p>
                </div>

                {/* Campos dinamicos segun tipo */}
                {formData.type === "REFERRAL" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Recompensa para quien refiere
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 10% en tu proxima visita"
                        value={formData.templateVariables.recompensa}
                        onChange={(e) => setTemplateVar("recompensa", e.target.value)}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-bold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                )}

                {formData.type === "BIRTHDAY" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Regalo
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Facial hidratante gratis"
                        value={formData.templateVariables.regalo}
                        onChange={(e) => setTemplateVar("regalo", e.target.value)}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-bold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Mensaje personalizado
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Ej. Te deseamos lo mejor en tu dia especial..."
                        value={formData.templateVariables.mensajePersonalizado}
                        onChange={(e) => setTemplateVar("mensajePersonalizado", e.target.value)}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Dias antes del cumpleanos para enviar
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={formData.templateVariables.daysBeforeBirthday}
                        onChange={(e) => setTemplateVar("daysBeforeBirthday", e.target.value)}
                        className="w-32 p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                )}

                {formData.type === "MAINTENANCE" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Tratamiento
                      </label>
                      <select
                        value={formData.maintenanceConfig.treatmentId}
                        onChange={(e) => handleTreatmentSelect(e.target.value)}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
                      >
                        <option value="">Seleccionar tratamiento...</option>
                        {treatments
                          .filter((t) => t.isActive !== false)
                          .map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name} {t.suggestedTouchUpDays ? `(${t.suggestedTouchUpDays} dias)` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Dias para retoque (override)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Se usa el del tratamiento si esta vacio"
                        value={formData.maintenanceConfig.touchUpDays}
                        onChange={(e) => setMaintenanceConfig({ touchUpDays: e.target.value })}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-black outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  </div>
                )}

                {formData.type === "SEASONAL" && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Producto a promocionar
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Suero Vitamina C"
                      value={formData.templateVariables.producto}
                      onChange={(e) => setTemplateVar("producto", e.target.value)}
                      className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-bold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}

                {formData.type === "CLEARANCE" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Producto
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Crema Retinol"
                        value={formData.templateVariables.producto}
                        onChange={(e) => setTemplateVar("producto", e.target.value)}
                        className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-base md:text-sm font-bold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Productos vinculados (inventario)
                      </label>
                      <select
                        multiple
                        value={formData.clearanceProducts || []}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (o) => o.value);
                          setFormData((prev) => ({ ...prev, clearanceProducts: selected }));
                        }}
                        className="w-full p-3 bg-white border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 min-h-[100px]"
                      >
                        {products
                          .filter((p) => p.isActive !== false)
                          .map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name} (Stock: {p.currentStock})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* FILA 2: Programacion (full width en desktop, tab en movil) */}
            <div
              className={`${mobileTab === "SCHEDULE" ? "block" : "hidden"} md:block animate-in fade-in duration-300`}
            >
              <h3 className="hidden md:flex text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] items-center gap-2 border-b border-slate-100 pb-2 mb-6">
                <Sparkle size={16} className="text-violet-500" /> 3. Programacion de Envio
              </h3>

              {isAutoSchedule ? (
                <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5 flex items-start gap-4">
                  <div className="p-3 bg-violet-100 text-violet-600 rounded-xl shrink-0">
                    <Sparkle size={20} weight="fill" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-violet-700 uppercase tracking-widest mb-1">
                      Envio Automatico
                    </p>
                    <p className="text-xs text-violet-600 leading-relaxed">
                      {formData.type === "WELCOME" &&
                        "Este cupon se enviara automaticamente cuando se complete la primera cita del paciente."}
                      {formData.type === "CLEARANCE" &&
                        "Este cupon se activara automaticamente cuando un producto vinculado llegue a stock critico."}
                      {formData.type === "BIRTHDAY" &&
                        "Este cupon se enviara automaticamente cuando sea el cumpleanos del paciente (requiere fecha de nacimiento registrada)."}
                      {formData.type === "MAINTENANCE" &&
                        "Este cupon se enviara automaticamente cuando se cumplan los dias de retoque despues del tratamiento."}
                    </p>
                  </div>
                </div>
              ) : formData.type === "REFERRAL" ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-4 mb-2">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                      <Sparkle size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-1">
                        Envio Automatico Post-Cita
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Se enviara N dias despues de que el paciente complete su cita.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                      Dias de espera despues de la cita
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
                /* SEASONAL: configuracion completa */
                <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5">
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
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                        Hora de Envio
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

                    {formData.schedule.frequency === "WEEKLY" && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                          Dia de la Semana
                        </label>
                        <select
                          value={formData.schedule.dayOfWeek}
                          onChange={(e) => setSchedule({ dayOfWeek: Number(e.target.value) })}
                          className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 appearance-none"
                        >
                          {DAYS_OF_WEEK.map((d, i) => (
                            <option key={i} value={i}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.schedule.frequency === "MONTHLY" && (
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                          Dia del Mes
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
            {mobileTab === "RULES" && (
              <button
                type="button"
                onClick={() => setMobileTab("CONFIG")}
                className="md:hidden flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Siguiente
              </button>
            )}
            {mobileTab === "CONFIG" && (
              <button
                type="button"
                onClick={() => setMobileTab("SCHEDULE")}
                className="md:hidden flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Programar
              </button>
            )}

            <button
              type="submit"
              form="couponForm"
              disabled={isSubmitting || !formData.code || !formData.expiresAt}
              className={`flex-1 sm:w-auto px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50 ${
                mobileTab === "SCHEDULE" ? "block" : "hidden md:block"
              }`}
            >
              {isSubmitting ? "Guardando..." : "Crear Campana"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CouponBuilderModal;
