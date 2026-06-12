"use client";
import { WarningCircleIcon } from "@phosphor-icons/react";

export default function FormError({ message, className = "" }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 ${className}`}
    >
      <WarningCircleIcon
        size={16}
        weight="bold"
        className="mt-0.5 shrink-0 text-rose-500"
      />
      <p className="text-[11px] font-bold leading-snug text-rose-600">
        {message}
      </p>
    </div>
  );
}
