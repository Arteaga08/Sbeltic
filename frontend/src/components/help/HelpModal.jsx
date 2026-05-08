"use client";
import { useEffect, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useScrollLock } from "@/hooks/useScrollLock";

export default function HelpModal({
  isOpen,
  onClose,
  title = "Cómo usar esta sección",
  subtitle = "Guía paso a paso",
  steps = [],
}) {
  useScrollLock(isOpen);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    if (isOpen) setOpenIndex(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 w-full h-dvh z-999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        className="bg-white w-full max-w-2xl rounded-modal border-2 border-slate-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto"
      >
        <div className="p-8 pb-4 flex justify-between items-start">
          <div>
            <h3
              id="help-modal-title"
              className="text-2xl font-extrabold italic uppercase text-slate-900 leading-none"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ayuda"
            className="text-slate-400 hover:text-rose-500 transition-colors font-black text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-8 pt-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {steps.map((step, index) => {
            const isOpen = openIndex === index;
            const Icon = step.icon;
            return (
              <div
                key={index}
                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                  isOpen
                    ? "border-slate-900 bg-white shadow-md"
                    : "border-slate-100 bg-slate-50 hover:border-slate-300"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-4 p-5 text-left"
                >
                  <span
                    className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${
                      isOpen
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-900 border border-slate-200"
                    }`}
                  >
                    {Icon ? (
                      <Icon size={18} weight="bold" />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="flex-1 font-extrabold italic uppercase text-slate-900 text-sm md:text-base leading-tight">
                    {step.title}
                  </span>
                  <CaretDownIcon
                    size={16}
                    weight="bold"
                    className={`shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-slate-900" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pl-[4.75rem] animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="text-sm font-medium text-slate-600 leading-relaxed space-y-2">
                      {typeof step.description === "string" ? (
                        <p>{step.description}</p>
                      ) : (
                        step.description
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-8 py-5 border-t-2 border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-rose-500 transition-all text-[10px] tracking-label uppercase"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
