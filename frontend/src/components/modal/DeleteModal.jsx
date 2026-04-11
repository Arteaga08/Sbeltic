"use client";
import { Warning } from "@phosphor-icons/react";

export default function DeleteModal({ isOpen, onClose, onConfirm, userName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-screen h-dvh z-1000 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] border-2 border-slate-900 shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Warning size={32} weight="duotone" />
        </div>

        <h3 className="text-2xl font-extrabold italic uppercase text-slate-900 leading-tight mb-2">
          ¿Desactivar Miembro?
        </h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
          Estás por dar de baja a{" "}
          <span className="text-slate-900">{userName}</span>
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-5 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-rose-900/20"
          >
            SÍ, DESACTIVAR ACCESO
          </button>
          <button
            onClick={onClose}
            className="w-full py-5 bg-slate-50 text-slate-400 font-black rounded-2xl hover:bg-slate-100 transition-all text-[10px] tracking-[0.2em] uppercase"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}
