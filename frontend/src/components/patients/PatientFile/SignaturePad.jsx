"use client";
import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Trash, Check, SealCheck } from "@phosphor-icons/react";

const SignaturePad = ({ onSave, label, existingSignature }) => {
  const sigRef = useRef(null);

  const clear = () => sigRef.current.clear();

  const handleSave = () => {
    if (sigRef.current.isEmpty()) return;
    // Exportamos como Base64
    const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase text-slate-400 italic ml-2 tracking-widest">
        {label}
      </label>

      {existingSignature ? (
        /* MUESTRA LA FIRMA SI YA EXISTE */
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-8 flex flex-col items-center justify-center animate-in zoom-in-95">
          <img
            src={existingSignature}
            alt="Firma del paciente"
            className="max-h-40 object-contain mix-blend-multiply"
          />
          <div className="mt-4 flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-[0.2em]">
            <SealCheck size={18} weight="fill" /> Documento Firmado Digitalmente
          </div>
        </div>
      ) : (
        /* PAD DE FIRMA PARA NUEVOS REGISTROS */
        <div className="relative group">
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] overflow-hidden transition-all group-hover:border-indigo-200">
            <SignatureCanvas
              ref={sigRef}
              penColor="#4f46e5"
              canvasProps={{
                className: "w-full h-64 cursor-crosshair",
              }}
            />
          </div>

          <div className="absolute bottom-6 right-6 flex gap-3">
            <button
              onClick={clear}
              className="p-4 bg-white text-slate-400 rounded-2xl shadow-xl hover:text-rose-500 transition-all active:scale-90"
              title="Limpiar"
            >
              <Trash size={20} weight="bold" />
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Check size={20} weight="bold" /> Guardar Firma
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePad;
