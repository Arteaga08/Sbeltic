"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation"; // 🌟 Mejor práctica para Next.js App Router
import SignatureCanvas from "react-signature-canvas";
import { CheckCircle, Eraser, PencilLine } from "@phosphor-icons/react"; // Quitamos 'user' que no se usaba
import { toast } from "sonner";

export default function PublicSignaturePage() {
  const params = useParams();
  const id = params?.id;
  const sigCanvas = useRef(null);

  const [data, setData] = useState(null);
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // 🧹 Función para limpiar el lienzo
  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  // 🔍 1. Cargar info del documento al abrir el link
  useEffect(() => {
    if (!id) return;

    const fetchDocInfo = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/info/${id}`,
        );
        const result = await res.json();
        if (result.success) setData(result.data);
      } catch (error) {
        toast.error("Link inválido o expirado");
      } finally {
        setLoading(false);
      }
    };
    fetchDocInfo();
  }, [id]);

  const handleSave = async () => {
    if (sigCanvas.current.isEmpty())
      return toast.error("Por favor, firma el recuadro.");

    setSending(true);
    const signatureBase64 = sigCanvas.current
      .getTrimmedCanvas()
      .toDataURL("image/png");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/sign/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signature: signatureBase64,
            type: data?.type,
          }),
        },
      );

      if (res.ok) setIsSent(true);
    } catch (error) {
      toast.error("Error al guardar firma");
    } finally {
      setSending(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 italic font-black uppercase text-slate-400 animate-pulse">
        Sbeltic Secure Link...
      </div>
    );

  if (isSent)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center bg-slate-50">
        <CheckCircle
          size={80}
          weight="fill"
          className="text-emerald-500 mb-4 animate-in zoom-in duration-500"
        />
        <h1 className="text-xl font-black uppercase text-slate-900">
          ¡Firma Registrada!
        </h1>
        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
          Ya puedes cerrar esta ventana, {data?.name?.split(" ")[0]}.
        </p>
      </div>
    );

  return (
    <div className="h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      <header className="py-6 text-center shrink-0">
        <h1 className="text-xl font-black italic text-slate-900 uppercase">
          Sbeltic
        </h1>
        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-1">
          {data?.type === "HISTORY"
            ? "Firma de Historia Clínica"
            : "Firma de Nota Médica"}
        </p>
      </header>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl p-6 flex flex-col border border-slate-100 max-w-md mx-auto w-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">
              Paciente
            </p>
            <p className="text-sm font-black text-slate-800 uppercase italic">
              {data?.name}
            </p>
          </div>

          {/* 🌟 Botón para limpiar firma integrado */}
          <button
            onClick={clearSignature}
            className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-colors"
            title="Borrar firma"
          >
            <Eraser size={20} weight="bold" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <PencilLine size={16} className="text-indigo-400" />
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Firma dentro del recuadro
          </p>
        </div>

        <div className="flex-1 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 relative overflow-hidden">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="#4f46e5"
            canvasProps={{
              className: "w-full h-full cursor-crosshair touch-none",
            }}
            // touch-none evita que la pantalla haga scroll al firmar en móvil
          />
        </div>

        <button
          onClick={handleSave}
          disabled={sending}
          className="w-full mt-6 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {sending ? "Guardando de forma segura..." : "Confirmar Firma"}
        </button>
      </div>
    </div>
  );
}
