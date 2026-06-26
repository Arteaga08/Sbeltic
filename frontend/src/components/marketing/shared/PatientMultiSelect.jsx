"use client";
import { useState, useEffect, useMemo } from "react";
import { MagnifyingGlass, WhatsappLogo, Check } from "@phosphor-icons/react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API = process.env.NEXT_PUBLIC_API_URL;

const normalize = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const TYPE_LABELS = {
  SPA: "Spa",
  INJECTION: "Inyectables",
  LEAD: "Prospecto",
  SURGERY: "Cirugía",
  POST_OP: "Post-op",
  OTHER: "Otro",
};

/**
 * Selector múltiple de pacientes para campañas de difusión.
 * Expone los pacientes elegidos (con teléfono) al padre vía onChange.
 */
const PatientMultiSelect = ({ selected, onChange }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [onlyWhatsApp, setOnlyWhatsApp] = useState(true);

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(`${API}/patients?limit=1000`);
        const data = await res.json();
        const raw =
          data.data?.patients ?? data.data ?? data.patients ?? data;
        setPatients(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPatients();
  }, []);

  const selectedIds = useMemo(
    () => new Set(selected.map((p) => p._id)),
    [selected],
  );

  const filtered = useMemo(() => {
    const term = normalize(search);
    const digits = search.replace(/\D/g, "");
    return patients.filter((p) => {
      if (onlyWhatsApp && !p.allowsWhatsAppNotifications) return false;
      if (typeFilter !== "ALL" && p.patientType !== typeFilter) return false;
      if (!term && !digits) return true;
      const phoneDigits = (p.phone || "").replace(/\D/g, "");
      return (
        normalize(p.name).includes(term) ||
        (digits.length >= 3 && phoneDigits.includes(digits))
      );
    });
  }, [patients, search, typeFilter, onlyWhatsApp]);

  const toggle = (patient) => {
    if (selectedIds.has(patient._id)) {
      onChange(selected.filter((p) => p._id !== patient._id));
    } else {
      onChange([...selected, patient]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono"
            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="ALL">Todos los tipos</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOnlyWhatsApp((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
            onlyWhatsApp
              ? "bg-emerald-50 text-emerald-600"
              : "bg-slate-50 text-slate-400"
          }`}
        >
          <WhatsappLogo size={16} weight="fill" /> Solo con WhatsApp activo
        </button>
        <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">
          {selected.length} seleccionados
        </span>
      </div>

      {/* Lista */}
      <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-72 overflow-y-auto scrollbar-hide">
        {loading ? (
          <p className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Cargando pacientes...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-xs font-bold text-slate-400 uppercase tracking-widest">
            No hay pacientes que coincidan
          </p>
        ) : (
          filtered.map((p) => {
            const isSelected = selectedIds.has(p._id);
            return (
              <button
                key={p._id}
                type="button"
                onClick={() => toggle(p)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-indigo-600 border-indigo-600"
                      : "border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <Check size={12} weight="bold" className="text-white" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-slate-800 truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {p.phone}
                    {p.patientType && TYPE_LABELS[p.patientType]
                      ? ` · ${TYPE_LABELS[p.patientType]}`
                      : ""}
                  </p>
                </div>
                {p.allowsWhatsAppNotifications && (
                  <WhatsappLogo
                    size={16}
                    weight="fill"
                    className="text-emerald-500 shrink-0"
                  />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PatientMultiSelect;
