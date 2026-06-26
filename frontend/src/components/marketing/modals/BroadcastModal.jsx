"use client";
import { useState, useEffect } from "react";
import {
  X,
  Megaphone,
  WhatsappLogo,
  PaperPlaneTilt,
  CheckCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { CONNECTION_ERROR } from "@/lib/apiError";
import FormError from "@/components/ui/FormError";
import { useScrollLock } from "@/hooks/useScrollLock";
import { toWhatsAppPhone } from "@/lib/whatsapp";
import PatientMultiSelect from "@/components/marketing/shared/PatientMultiSelect";

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Modal de campaña de difusión por WhatsApp.
 * Paso 1: redactar mensaje + seleccionar pacientes → crea la campaña.
 * Paso 2: enviar uno por uno con enlaces wa.me, marcando el progreso.
 * Si recibe `broadcast`, abre directamente en el paso de envío (continuar campaña).
 */
const BroadcastModal = ({ isOpen, broadcast: initialBroadcast, onClose, onUpdate }) => {
  useScrollLock(isOpen);
  const [step, setStep] = useState("COMPOSE");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState([]);
  const [broadcast, setBroadcast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialBroadcast) {
        setBroadcast(initialBroadcast);
        setMessage(initialBroadcast.message);
        setStep("SEND");
      } else {
        setStep("COMPOSE");
        setMessage("");
        setSelected([]);
        setBroadcast(null);
      }
      setFormError("");
    }
  }, [isOpen, initialBroadcast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!message.trim()) {
      setFormError("Escribe el mensaje de la campaña.");
      return;
    }
    if (selected.length === 0) {
      setFormError("Selecciona al menos un paciente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth(`${API}/broadcasts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          patientIds: selected.map((p) => p._id),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcast(data.data);
        setStep("SEND");
        onUpdate?.();
        toast.success("Campaña creada");
      } else {
        setFormError(data.message || "No se pudo crear la campaña.");
      }
    } catch (error) {
      setFormError(CONNECTION_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async (recipient) => {
    // Abrir WhatsApp con el texto precargado
    const phone = toWhatsAppPhone(recipient.phone);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(broadcast.message)}`;
    window.open(url, "_blank", "noopener,noreferrer");

    if (recipient.sent) return;

    try {
      const res = await fetchWithAuth(
        `${API}/broadcasts/${broadcast._id}/recipients/${recipient.patientId}`,
        { method: "PATCH" },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcast(data.data);
        onUpdate?.();
      }
    } catch (error) {
      toast.error("No se pudo marcar como enviado");
    }
  };

  if (!isOpen) return null;

  const sentCount = broadcast?.sentCount ?? 0;
  const total = broadcast?.totalRecipients ?? 0;
  const progress = total > 0 ? Math.round((sentCount / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-10010 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Megaphone size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase italic">
                {step === "COMPOSE" ? "Nueva Difusión" : "Enviar Campaña"}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {step === "COMPOSE"
                  ? "Mensaje masivo por WhatsApp"
                  : `${sentCount} de ${total} enviados`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full"
          >
            <X size={20} weight="bold" className="text-slate-400" />
          </button>
        </div>

        {step === "COMPOSE" ? (
          <form
            onSubmit={handleCreate}
            onInput={() => formError && setFormError("")}
            className="p-8 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-hide"
          >
            {/* Mensaje */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Mensaje de la campaña
              </label>
              <textarea
                rows={5}
                maxLength={1024}
                placeholder="Hola 👋 Tenemos una promoción especial para ti..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-right text-[10px] font-bold text-slate-400">
                {message.length}/1024
              </p>
            </div>

            {/* Pacientes */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Pacientes destinatarios
              </label>
              <PatientMultiSelect selected={selected} onChange={setSelected} />
            </div>

            <FormError message={formError} />

            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-emerald-700 shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PaperPlaneTilt size={18} weight="bold" />
              {isSubmitting ? "Creando..." : "Crear campaña"}
            </button>
          </form>
        ) : (
          <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-hide">
            {/* Barra de progreso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Progreso</span>
                <span className="text-emerald-600">
                  {sentCount} de {total} enviados
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Mensaje (preview) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {broadcast?.message}
              </p>
            </div>

            {/* Destinatarios */}
            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto scrollbar-hide">
              {broadcast?.recipients?.map((r) => (
                <div
                  key={r.patientId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-slate-800 truncate">
                      {r.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{r.phone}</p>
                  </div>
                  {r.sent ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-black uppercase tracking-widest shrink-0">
                      <CheckCircle size={16} weight="fill" /> Enviado
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSend(r)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shrink-0"
                    >
                      <WhatsappLogo size={14} weight="fill" /> Enviar
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase italic tracking-widest hover:bg-slate-200 transition-all"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BroadcastModal;
