"use client";

import { useEffect, useState } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API = process.env.NEXT_PUBLIC_API_URL;

const ROOM_OPTIONS = [
  { value: "CABINA_1", label: "Cabina 1" },
  { value: "CABINA_2", label: "Cabina 2" },
  { value: "CABINA_3", label: "Cabina 3" },
  { value: "SPA", label: "Spa" },
  { value: "CONSULTORIO", label: "Consultorio" },
  { value: "QUIROFANO", label: "Quirófano" },
];

const HOURS_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MIN_OPTIONS = [0, 15, 30, 45];

const pad = (n) => String(n).padStart(2, "0");

const splitDateTime = (iso) => {
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
};

const formatHuman = (iso) =>
  new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export default function RescheduleModal({
  appointment,
  isOpen,
  onClose,
  onRescheduled,
  staff = [],
}) {
  useScrollLock(isOpen);

  const [form, setForm] = useState({
    date: "",
    time: "",
    doctorId: "",
    roomId: "CABINA_1",
    durationHours: 0,
    durationMinutes: 30,
  });
  const [error, setError] = useState("");
  const [suggestedSlot, setSuggestedSlot] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!appointment || !isOpen) return;
    const { date, time } = splitDateTime(appointment.appointmentDate);
    const dur = appointment.duration || 30;
    setForm({
      date,
      time,
      doctorId: appointment.doctorId?._id || appointment.doctorId || "",
      roomId: appointment.roomId || "CABINA_1",
      durationHours: Math.floor(dur / 60),
      durationMinutes: dur % 60,
    });
    setError("");
    setSuggestedSlot(null);
  }, [appointment, isOpen]);

  if (!isOpen || !appointment) return null;

  const totalDuration = form.durationHours * 60 + form.durationMinutes;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError("");
    setSuggestedSlot(null);

    if (!form.date || !form.time) {
      setError("Selecciona fecha y hora.");
      return;
    }
    const newDate = new Date(`${form.date}T${form.time}:00`);
    if (isNaN(newDate.getTime())) {
      setError("Fecha u hora inválida.");
      return;
    }
    if (newDate <= new Date()) {
      setError("No puedes reagendar en el pasado.");
      return;
    }
    if (newDate.getDay() === 0) {
      setError("La clínica cierra los domingos.");
      return;
    }
    if (totalDuration < 15) {
      setError("La duración mínima es de 15 minutos.");
      return;
    }
    if (!form.doctorId) {
      setError("Selecciona personal que atiende.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetchWithAuth(`${API}/appointments/${appointment._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: appointment.status,
          appointmentDate: newDate.toISOString(),
          doctorId: form.doctorId,
          roomId: form.roomId,
          duration: totalDuration,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        onRescheduled?.(data.data);
        return;
      }

      if (res.status === 409 && data.code === "SCHEDULE_FULL") {
        setError(data.message || "Agenda llena en ese horario.");
        if (data.data?.nextAvailableSlot?.suggestedDate) {
          setSuggestedSlot({
            date: data.data.nextAvailableSlot.suggestedDate,
            rooms: data.data.nextAvailableSlot.suggestedRooms || [],
          });
        }
        return;
      }

      setError(data.message || data.errors?.[0]?.message || "No se pudo reagendar la cita.");
    } catch {
      setError("Error de conexión con el servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const applySuggestedSlot = () => {
    if (!suggestedSlot) return;
    const { date, time } = splitDateTime(suggestedSlot.date);
    setForm((f) => ({
      ...f,
      date,
      time,
      ...(suggestedSlot.rooms.length > 0 && !suggestedSlot.rooms.includes(f.roomId)
        ? { roomId: suggestedSlot.rooms[0] }
        : {}),
    }));
    setError("");
    setSuggestedSlot(null);
  };

  return (
    <div className="fixed top-0 left-0 w-screen h-dvh bg-slate-900/70 backdrop-blur-sm z-10000 flex items-center justify-center p-4">
      <div className="bg-white w-full md:max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-500">
              Reagendar cita
            </p>
            <h2 className="text-lg font-black text-slate-900 leading-tight mt-0.5 uppercase">
              {appointment.patientId?.name || "Paciente"}
            </h2>
            <p className="text-sm text-slate-500">{appointment.treatmentName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-slate-100 transition-colors text-slate-400 text-lg font-bold shrink-0 ml-4"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Cita actual */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Cita actual
            </p>
            <p className="text-sm font-bold text-slate-700 capitalize">
              {formatHuman(appointment.appointmentDate)}
            </p>
            <p className="text-xs text-slate-500">
              {appointment.roomId?.replace("_", " ")} · {appointment.duration} min · {appointment.doctorId?.name || "—"}
            </p>
          </div>

          {/* Fecha + Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nueva fecha
              </label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-teal-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nueva hora
              </label>
              <input
                type="time"
                required
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-teal-400"
              />
            </div>
          </div>

          {/* Doctor + Cabina */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Personal
              </label>
              <select
                required
                value={form.doctorId}
                onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-teal-400"
              >
                <option value="">Selecciona personal...</option>
                {staff.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}{u.role ? ` (${u.role})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Cabina
              </label>
              <select
                value={form.roomId}
                onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                className="w-full p-3 rounded-xl border border-slate-200 outline-none text-sm focus:border-teal-400"
              >
                {ROOM_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duración */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Duración
              {totalDuration > 0 && (
                <span className="ml-2 text-teal-500 normal-case font-bold">
                  = {Math.floor(totalDuration / 60) > 0 ? `${Math.floor(totalDuration / 60)}h ` : ""}{totalDuration % 60}min
                </span>
              )}
            </label>
            <div className="flex gap-2">
              <select
                value={form.durationHours}
                onChange={(e) => setForm((f) => ({ ...f, durationHours: Number(e.target.value) }))}
                className="flex-1 p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold focus:border-teal-400"
              >
                {HOURS_OPTIONS.map((h) => (
                  <option key={h} value={h}>{h}h</option>
                ))}
              </select>
              <select
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                className="flex-1 p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold focus:border-teal-400"
              >
                {MIN_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}min</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 space-y-2">
              <p className="text-xs font-bold text-rose-600">{error}</p>
              {suggestedSlot && (
                <button
                  type="button"
                  onClick={applySuggestedSlot}
                  className="w-full py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wide hover:bg-rose-600 transition-colors"
                >
                  Usar próximo slot: {formatHuman(suggestedSlot.date)}
                </button>
              )}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 py-3 bg-slate-900 text-white font-black uppercase rounded-2xl text-xs tracking-widest hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
