"use client";
import { QuestionIcon } from "@phosphor-icons/react";

export default function HelpButton({
  onClick,
  label = "Ver ayuda de la sección",
  className = "",
  size = 16,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`shrink-0 inline-flex items-center justify-center rounded-full text-slate-300 hover:text-slate-700 transition-colors ${className}`}
    >
      <QuestionIcon size={size} weight="bold" />
    </button>
  );
}
