"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  X,
  CheckCircle,
  ArrowsLeftRight,
  Trash,
  CalendarBlank,
  ImageSquare,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAuthImage } from "@/hooks/useAuthImage";

const TYPE_META = {
  BEFORE: { label: "Antes", color: "bg-amber-500", text: "text-amber-700", soft: "bg-amber-50" },
  AFTER: { label: "Después", color: "bg-emerald-500", text: "text-emerald-700", soft: "bg-emerald-50" },
  POST_OP: { label: "Post-Op", color: "bg-rose-500", text: "text-rose-700", soft: "bg-rose-50" },
  EVOLUCION: { label: "Evolución", color: "bg-indigo-500", text: "text-indigo-700", soft: "bg-indigo-50" },
};

const FILTERS = [
  { id: "ALL", label: "Todas" },
  { id: "BEFORE", label: "Antes" },
  { id: "AFTER", label: "Después" },
  { id: "POST_OP", label: "Post-Op" },
  { id: "EVOLUCION", label: "Evolución" },
];

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp"];

const photoStreamUrl = (patientId, storedUrl) => {
  const filename = storedUrl.split("/").pop();
  return `${process.env.NEXT_PUBLIC_API_URL}/patients/${patientId}/photos/file/${filename}`;
};

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const PhotosTab = ({ patient, userRole, onUpdate }) => {
  const [filter, setFilter] = useState("ALL");
  const [compareMode, setCompareMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const [comparison, setComparison] = useState(null);

  const photos = patient?.photos || [];
  const isAdmin = userRole === "ADMIN";

  const filtered = useMemo(() => {
    const list = filter === "ALL" ? photos : photos.filter((p) => p.type === filter);
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [photos, filter]);

  useEffect(() => {
    if (!compareMode) setSelected([]);
  }, [compareMode]);

  const toggleSelect = (photoId) => {
    setSelected((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId);
      if (prev.length >= 2) return [prev[1], photoId];
      return [...prev, photoId];
    });
  };

  const openComparison = () => {
    if (selected.length !== 2) return;
    const [a, b] = selected.map((id) => photos.find((p) => p._id === id));
    setComparison({ a, b });
  };

  const handleDelete = async (photo) => {
    if (!confirm("¿Eliminar esta foto? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patient._id}/photos/${photo._id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Foto eliminada");
        onUpdate();
      } else {
        toast.error(data.message || "Error al eliminar");
      }
    } catch {
      toast.error("Error de conexión");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <ImageSquare size={32} className="text-slate-300 mb-3" />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
          Acceso restringido
        </p>
        <p className="text-xs font-bold text-slate-500 mt-2">
          Solo el administrador puede ver fotos del paciente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header sticky con acciones */}
      <div className="sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
            <ImageIcon size={20} weight="bold" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest leading-none mb-1">
              Galería del Paciente
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {photos.length} {photos.length === 1 ? "foto" : "fotos"} registradas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setCompareMode((v) => !v)}
            disabled={photos.length < 2}
            className={`shrink-0 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
              compareMode
                ? "bg-amber-500 text-white shadow-amber-100"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <ArrowsLeftRight size={16} weight="bold" />
            {compareMode ? "Cancelar" : "Comparar"}
          </button>

          <button
            onClick={() => setShowUpload(true)}
            className="shrink-0 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 bg-indigo-600 text-white shadow-lg shadow-indigo-100 whitespace-nowrap active:scale-95 transition-all"
          >
            <Plus size={16} weight="bold" />
            Subir Foto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          const meta = TYPE_META[f.id];
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                isActive
                  ? meta
                    ? `${meta.color} text-white shadow-md`
                    : "bg-slate-800 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Acción flotante comparar */}
      {compareMode && selected.length === 2 && (
        <button
          onClick={openComparison}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-widest bg-amber-500 text-white shadow-2xl shadow-amber-300 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4"
        >
          <ArrowsLeftRight size={18} weight="bold" />
          Ver comparación
        </button>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-modal border border-dashed border-slate-200">
          <ImageSquare size={40} className="text-slate-300 mb-3" />
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {photos.length === 0 ? "Sin fotos aún" : "Sin fotos en este filtro"}
          </p>
          {photos.length === 0 && (
            <p className="text-xs font-bold text-slate-500 mt-2">
              Sube la primera foto con el botón de arriba.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((photo, idx) => (
            <PhotoCard
              key={photo._id}
              photo={photo}
              patientId={patient._id}
              compareMode={compareMode}
              isSelected={selected.includes(photo._id)}
              onClick={() => {
                if (compareMode) toggleSelect(photo._id);
                else setLightboxIdx(idx);
              }}
              onDelete={() => handleDelete(photo)}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {showUpload && (
        <PhotoUploadModal
          patientId={patient._id}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            onUpdate();
          }}
        />
      )}

      {lightboxIdx !== null && (
        <Lightbox
          photos={filtered}
          index={lightboxIdx}
          patientId={patient._id}
          onClose={() => setLightboxIdx(null)}
          onNavigate={setLightboxIdx}
        />
      )}

      {comparison && (
        <ComparisonLightbox
          photoA={comparison.a}
          photoB={comparison.b}
          patientId={patient._id}
          onClose={() => setComparison(null)}
        />
      )}
    </div>
  );
};

/* ─────────── PhotoCard ─────────── */
const PhotoCard = ({ photo, patientId, compareMode, isSelected, onClick, onDelete }) => {
  const cardRef = useRef(null);
  const meta = TYPE_META[photo.type] || TYPE_META.EVOLUCION;
  const url = photoStreamUrl(patientId, photo.thumbUrl);
  const { src, loading } = useAuthImage(url, { lazyRef: cardRef });

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`relative group aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${
        isSelected
          ? "border-amber-500 ring-4 ring-amber-200 scale-95"
          : "border-transparent hover:scale-[1.02]"
      }`}
    >
      {/* Placeholder mientras carga */}
      <div className={`absolute inset-0 ${meta.soft} flex items-center justify-center`}>
        {loading || !src ? (
          <ImageSquare size={28} className="text-slate-300 animate-pulse" />
        ) : null}
      </div>

      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={photo.caption || meta.label} className="absolute inset-0 w-full h-full object-cover" />
      )}

      {/* Overlay metadata */}
      <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-white ${meta.color} shadow-md`}>
          {meta.label}
        </span>
        {compareMode && (
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
              isSelected ? "bg-amber-500 text-white" : "bg-white/80 text-transparent"
            }`}
          >
            <CheckCircle size={20} weight="fill" />
          </span>
        )}
      </div>
      <div className="absolute bottom-2 left-2 right-2 text-white">
        <p className="text-[9px] font-black uppercase tracking-widest opacity-90">
          {formatDate(photo.date)}
        </p>
        {photo.caption && (
          <p className="text-[10px] font-bold truncate opacity-95 mt-0.5">{photo.caption}</p>
        )}
      </div>

      {!compareMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-xl bg-rose-500 text-white md:bg-rose-500/0 md:text-white/0 md:group-hover:bg-rose-500 md:group-hover:text-white flex items-center justify-center transition-all active:scale-90"
          title="Eliminar"
        >
          <Trash size={14} weight="bold" />
        </button>
      )}
    </div>
  );
};

/* ─────────── PhotoUploadModal ─────────── */
const PhotoUploadModal = ({ patientId, onClose, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("BEFORE");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ACCEPTED_MIMES.includes(f.type)) {
      toast.error("Formato no soportado. Usa JPEG, PNG o WEBP.");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("La foto excede 25MB.");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Selecciona un archivo");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      formData.append("date", date);
      formData.append("caption", caption);

      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/patients/${patientId}/photos`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Foto subida");
        onUploaded();
      } else {
        toast.error(data.message || "Error al subir foto");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10100 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-modal w-full max-w-lg shadow-2xl overflow-hidden">
        <header className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
              <Plus size={20} weight="bold" />
            </div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
              Subir Foto
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
          >
            <X size={18} weight="bold" />
          </button>
        </header>

        <div className="p-6 space-y-5">
          {/* File input + preview */}
          <label className="block cursor-pointer">
            <div
              className={`aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden ${
                previewUrl ? "border-transparent" : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/30"
              }`}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <ImageSquare size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Selecciona una imagen
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1">
                    JPEG, PNG o WEBP · máx 25MB
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              accept={ACCEPTED_MIMES.join(",")}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Tipo */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TYPE_META).map(([key, m]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    type === key
                      ? `${m.color} text-white shadow-md`
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Fecha de la foto
            </label>
            <div className="relative">
              <CalendarBlank size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
              Nota (opcional)
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Ej. Zona abdomen, sesión 3"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        <footer className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || submitting}
            className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Subiendo..." : "Guardar"}
          </button>
        </footer>
      </div>
    </div>
  );
};

/* ─────────── Lightbox simple ─────────── */
const Lightbox = ({ photos, index, patientId, onClose, onNavigate }) => {
  const photo = photos[index];
  const meta = TYPE_META[photo.type] || TYPE_META.EVOLUCION;
  const url = photoStreamUrl(patientId, photo.webUrl);
  const { src, loading } = useAuthImage(url);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate((index - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") onNavigate((index + 1) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onClose, onNavigate]);

  const prev = () => onNavigate((index - 1 + photos.length) % photos.length);
  const next = () => onNavigate((index + 1) % photos.length);

  return (
    <div className="fixed inset-0 z-10100 bg-black/95 flex items-center justify-center animate-in fade-in">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all"
      >
        <X size={20} weight="bold" />
      </button>

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20"
          >
            <CaretLeft size={24} weight="bold" />
          </button>
          <button
            onClick={next}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20"
          >
            <CaretRight size={24} weight="bold" />
          </button>
        </>
      )}

      <div className="max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center p-8 gap-4">
        {loading || !src ? (
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={photo.caption || meta.label} className="max-w-full max-h-[75vh] object-contain rounded-2xl" />
        )}

        <div className="text-center text-white">
          <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${meta.color} shadow-md mb-2`}>
            {meta.label}
          </span>
          <p className="text-xs font-bold opacity-80">{formatDate(photo.date)}</p>
          {photo.caption && (
            <p className="text-sm font-medium mt-2 opacity-95 max-w-md mx-auto">{photo.caption}</p>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────── ComparisonLightbox ─────────── */
const ComparisonLightbox = ({ photoA, photoB, patientId, onClose }) => {
  const urlA = photoStreamUrl(patientId, photoA.webUrl);
  const urlB = photoStreamUrl(patientId, photoB.webUrl);
  const a = useAuthImage(urlA);
  const b = useAuthImage(urlB);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const renderSide = (photo, hook) => {
    const meta = TYPE_META[photo.type] || TYPE_META.EVOLUCION;
    return (
      <div className="flex-1 flex flex-col p-3 md:p-4 gap-2 min-w-0 min-h-0 overflow-hidden">
        <div className="relative flex-1 w-full min-h-0 rounded-xl overflow-hidden">
          {hook.loading || !hook.src ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hook.src} alt={photo.caption || meta.label} className="absolute inset-0 w-full h-full object-contain" />
          )}
        </div>
        <div className="shrink-0 text-center text-white">
          <span className={`inline-block px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${meta.color} shadow-md mb-1`}>
            {meta.label}
          </span>
          <p className="text-[10px] font-bold opacity-80">{formatDate(photo.date)}</p>
          {photo.caption && (
            <p className="text-[10px] font-medium mt-0.5 opacity-90 max-w-xs mx-auto truncate">{photo.caption}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-10100 bg-black/95 animate-in fade-in">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 p-3 rounded-2xl bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} weight="bold" />
      </button>
      <div className="absolute inset-0 flex flex-col md:flex-row">
        {renderSide(photoA, a)}
        <div className="shrink-0 h-px w-full md:h-auto md:w-px bg-white/20" />
        {renderSide(photoB, b)}
      </div>
    </div>
  );
};

export default PhotosTab;
