"use client";
import { useState } from "react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";

const WhatsAppSignatureButton = ({
  patientPhone,
  patientName,
  patientId,
  evolutionId,
  type = "HISTORY",
}) => {
  const [loading, setLoading] = useState(false);

  const isMedicalHistoryForm = type === "MEDICAL_HISTORY_FORM";

  const sendWhatsApp = async () => {
    if (!patientId || patientId === "undefined") {
      return toast.error("Aún no hay un ID generado para enviar el enlace");
    }

    if (!patientPhone) {
      return toast.error("El paciente no tiene un número registrado");
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("sbeltic_token");

      const endpoint = isMedicalHistoryForm
        ? `${process.env.NEXT_PUBLIC_API_URL}/patients/${patientId}/medical-history-token`
        : `${process.env.NEXT_PUBLIC_API_URL}/patients/${patientId}/signature-token`;

      const body = isMedicalHistoryForm
        ? {}
        : { type, targetId: type === "EVOLUTION" ? evolutionId : undefined };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al generar link");

      const link = data.data.signLink;
      const firstName = patientName ? patientName.split(" ")[0] : "Paciente";

      const message = isMedicalHistoryForm
        ? `Hola ${firstName}, por favor completa tu historial médico de Sbeltic en el siguiente enlace seguro (expira en 1 hora):\n${link}`
        : `Hola ${firstName}, por favor firma tu ${type === "HISTORY" ? "historia clínica" : "nota médica"} de Sbeltic en el siguiente enlace: ${link}`;

      window.open(
        `https://wa.me/${patientPhone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    } catch (err) {
      toast.error(err.message || "No se pudo generar el enlace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={sendWhatsApp}
      disabled={loading}
      className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all duration-500 group shrink-0 disabled:opacity-50"
    >
      <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-emerald-400 transition-colors">
        <WhatsappLogo
          size={20}
          weight="fill"
          className="group-hover:text-white transition-colors"
        />
      </div>
      <div className="text-left">
        <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 group-hover:text-white transition-colors">
          {loading
            ? "Generando enlace..."
            : isMedicalHistoryForm
              ? "Enviar Historial Médico"
              : "Enviar Firma a WhatsApp"}
        </p>
        <p className="text-[8px] font-bold opacity-70 uppercase tracking-tighter group-hover:text-emerald-50 transition-colors">
          {isMedicalHistoryForm
            ? "El paciente llenará el formulario desde su móvil"
            : "El paciente firmará desde su móvil"}
        </p>
      </div>
    </button>
  );
};

export default WhatsAppSignatureButton;
