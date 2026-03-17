"use client";
import { useState } from "react";
import { Scroll, Gavel, ShieldCheck } from "@phosphor-icons/react";
import SignaturePad from "../SignaturePad";
import { toast } from "sonner";

const SignatureTab = ({ patient, onUpdate }) => {
  const [isSaving, setIsSaving] = useState(false);

  const saveSignature = async (base64Signature) => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patient._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ historySignature: base64Signature }),
        },
      );

      const data = await res.json();
      if (data.success) {
        toast.success("Firma guardada y vinculada al expediente");
        onUpdate(); // Refresca el modal padre
      }
    } catch (error) {
      toast.error("No se pudo guardar la firma");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SECCIÓN LEGAL / CONSENTIMIENTO */}
      <div className="bg-slate-50 p-8 md:p-12 rounded-[3.5rem] border border-slate-100 space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
            <Scroll size={24} weight="bold" />
          </div>
          <div>
            <h3 className="text-xl font-black italic uppercase text-slate-900 leading-none">
              Consentimiento de Información
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              Validación jurídica del expediente clínico
            </p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">
            Yo,{" "}
            <span className="text-indigo-600 font-black">{patient.name}</span>,
            declaro bajo protesta de decir verdad que la información
            proporcionada en este historial clínico es verídica y completa.
            Comprendo que omitir datos sobre alergias, cirugías previas o
            padecimientos actuales puede comprometer los resultados de mis
            tratamientos y mi seguridad personal. Autorizo a{" "}
            <span className="text-slate-800 font-black">SBELTIC</span> y a su
            personal médico autorizado para el manejo de mis datos personales y
            clínicos conforme al Aviso de Privacidad.
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-white/60 rounded-2xl border border-indigo-50">
          <ShieldCheck size={20} className="text-indigo-500" weight="fill" />
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
            Esta firma tiene validez legal conforme a la NOM-004-SSA3-2012 del
            expediente clínico.
          </p>
        </div>
      </div>

      {/* ÁREA DE FIRMA */}
      <div className="px-4">
        <SignaturePad
          label="Firma de Conformidad del Paciente"
          existingSignature={patient.historySignature}
          onSave={saveSignature}
        />
      </div>
    </div>
  );
};

export default SignatureTab;
