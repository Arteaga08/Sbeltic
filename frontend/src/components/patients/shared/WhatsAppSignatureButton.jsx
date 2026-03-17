"use client";
import { WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";

const WhatsAppSignatureButton = ({
  patientPhone,
  patientName,
  patientId,
  type = "HISTORY",
}) => {
  const generateLink = () => {
    const baseUrl = window.location.origin;
    // 🌟 Usamos patientId que es lo que mandan los modales
    return `${baseUrl}/public/${patientId}`;
  };

  const sendWhatsApp = () => {
    // 🛡️ BLINDAJE: Verificamos patientId
    if (!patientId || patientId === "undefined") {
      console.error("Error: patientId no es válido");
      return toast.error("Aún no hay un ID generado para enviar el enlace");
    }

    if (!patientPhone) {
      return toast.error("El paciente no tiene un número registrado");
    }

    const link = generateLink();
    const firstName = patientName ? patientName.split(" ")[0] : "Paciente";
    const message = `Hola ${firstName}, por favor firma tu ${type === "HISTORY" ? "historia clínica" : "nota médica"} de Sbeltic en el siguiente enlace: ${link}`;
    const encodedMessage = encodeURIComponent(message);

    // Abrir WhatsApp
    window.open(
      `https://wa.me/${patientPhone}?text=${encodedMessage}`,
      "_blank",
    );
  };

  return (
    <button
      onClick={sendWhatsApp}
      className="flex items-center gap-3 px-6 py-4 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all duration-500 group shrink-0"
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
          Enviar Firma a WhatsApp
        </p>
        <p className="text-[8px] font-bold opacity-70 uppercase tracking-tighter group-hover:text-emerald-50 transition-colors">
          El paciente firmará desde su móvil
        </p>
      </div>
    </button>
  );
};

export default WhatsAppSignatureButton;
