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

  const sendWhatsApp = async () => {
    if (!patientId || patientId === "undefined") {
      return toast.error("Aún no hay un ID generado para enviar el enlace");
    }

    if (!patientPhone) {
      return toast.error("El paciente no tiene un número registrado");
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patientId}/signature-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type,
            targetId: type === "EVOLUTION" ? evolutionId : undefined,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al generar link");

      const link = data.data.signLink;
      const firstName = patientName ? patientName.split(" ")[0] : "Paciente";
      const message = `Hola ${firstName}, por favor firma tu ${type === "HISTORY" ? "historia clínica" : "nota médica"} de Sbeltic en el siguiente enlace: ${link}`;
      const encodedMessage = encodeURIComponent(message);

      window.open(
        `https://wa.me/${patientPhone}?text=${encodedMessage}`,
        "_blank",
      );
    } catch (err) {
      toast.error(err.message || "No se pudo generar el enlace de firma");
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
          {loading ? "Generando enlace..." : "Enviar Firma a WhatsApp"}
        </p>
        <p className="text-[8px] font-bold opacity-70 uppercase tracking-tighter group-hover:text-emerald-50 transition-colors">
          El paciente firmará desde su móvil
        </p>
      </div>
    </button>
  );
};

export default WhatsAppSignatureButton;
