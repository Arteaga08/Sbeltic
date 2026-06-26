"use client";
import {
  Megaphone,
  Trash,
  PaperPlaneTilt,
  Users,
  CalendarBlank,
  CheckCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API = process.env.NEXT_PUBLIC_API_URL;

const BroadcastCard = ({ broadcast, onOpen, onRefresh }) => {
  const { _id, message, totalRecipients, sentCount, createdAt } = broadcast;

  const isComplete = sentCount >= totalRecipients && totalRecipients > 0;
  const progress =
    totalRecipients > 0 ? Math.round((sentCount / totalRecipients) * 100) : 0;
  const date = createdAt ? new Date(createdAt) : null;

  const handleDelete = async () => {
    if (
      !confirm(
        "Eliminar esta campaña del historial? Esta acción no se puede deshacer.",
      )
    )
      return;
    try {
      const res = await fetchWithAuth(`${API}/broadcasts/${_id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Campaña eliminada");
        onRefresh?.();
      } else {
        toast.error("Error al eliminar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="bg-white border-2 border-slate-50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            isComplete
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isComplete ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
            }`}
          />
          <span className="text-[8px] font-black uppercase tracking-widest">
            {isComplete ? "Completada" : "Pendiente"}
          </span>
        </div>

        <button
          onClick={handleDelete}
          className="text-slate-300 hover:text-rose-500 transition-colors"
          title="Eliminar campaña"
        >
          <Trash size={20} weight="bold" />
        </button>
      </div>

      {/* Mensaje */}
      <div className="flex items-start gap-2 mb-6 flex-1">
        <Megaphone
          size={18}
          weight="duotone"
          className="text-emerald-500 shrink-0 mt-0.5"
        />
        <p className="text-sm font-medium text-slate-700 leading-snug line-clamp-3">
          {message}
        </p>
      </div>

      {/* Progreso */}
      <div className="space-y-2 mb-5">
        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <Users size={12} weight="fill" /> {sentCount} / {totalRecipients}{" "}
            enviados
          </span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-2.5 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Pie */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <CalendarBlank size={16} weight="bold" className="text-slate-300" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
            {date ? date.toLocaleDateString() : "—"}
          </span>
        </div>

        <button
          onClick={() => onOpen?.(broadcast)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-[9px] font-black uppercase tracking-widest ${
            isComplete
              ? "bg-slate-50 text-slate-500 hover:bg-slate-100"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          }`}
        >
          {isComplete ? (
            <>
              <CheckCircle size={14} weight="bold" /> Ver
            </>
          ) : (
            <>
              <PaperPlaneTilt size={14} weight="bold" /> Continuar
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BroadcastCard;
