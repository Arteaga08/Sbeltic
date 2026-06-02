"use client";
import { useState, useEffect } from "react";
import {
  Plus,
  RocketLaunch,
  UsersThree,
  CalendarCheck,
  WarningCircle,
  Megaphone,
  ChartLineUp,
  HandCoins,
  CaretLeft,
  Cake,
  FirstAid,
  Ticket,
} from "@phosphor-icons/react";
import { toast } from "sonner";

// Modales y Componentes
import CouponBuilderModal from "@/components/marketing/modals/CouponBuilderModal";
import ManualCouponModal from "@/components/marketing/modals/ManualCouponModal";
import ReferralCouponModal from "@/components/marketing/modals/ReferralCouponModal";
import CampaignCard from "@/components/marketing/shared/CampaignCard";
import ReferralCard from "@/components/marketing/shared/ReferralCard";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useTreatmentCategories } from "@/context/TreatmentCategoriesContext";
import HelpButton from "@/components/help/HelpButton";
import HelpModal from "@/components/help/HelpModal";
import { marketingHelpSteps, marketingHelpMeta } from "@/components/help/content/marketingHelpSteps";

const REFERRALS_ID = "__REFERRALS__";

export default function MarketingPage() {
  const treatmentCategories = useTreatmentCategories();
  // mode: null (portada con 2 widgets) | "MANUAL" | "AUTO"
  const [mode, setMode] = useState(null);
  const [currentView, setCurrentView] = useState("DASHBOARD");
  const [selectedCategory, setSelectedCategory] = useState("WELCOME");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  const [stats, setStats] = useState({
    conversion: "0%",
    referrals: "0",
    savings: "$0",
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // 🌟 3. ESTADÍSTICAS: Conexión preparada
  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/coupons/stats`,
        );
        const data = await res.json();
        if (data.success || res.ok) {
          setStats({
            conversion: `${data.data.conversionRate}%`,
            referrals: data.data.totalReferrals.toString(),
            savings: `$${data.data.totalSavings.toLocaleString()}`,
          });
        }
      } catch (error) {
        console.error("Error al cargar estadísticas reales");
        setStatsError(true);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const queryString =
        mode === "MANUAL"
          ? selectedCategory === REFERRALS_ID
            ? `type=REFERRAL&origin=MANUAL`
            : `origin=MANUAL&category=${selectedCategory}`
          : `type=${selectedCategory}`;
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/coupons?${queryString}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (data.success || res.ok) {
        setCampaigns(data.data?.coupons || data.data || []);
      }
    } catch (error) {
      toast.error("Error al cargar las campañas");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (currentView === "LIST") {
      fetchCampaigns();
    }
  }, [currentView, selectedCategory]);

  // Módulos automáticos (campañas con plantilla de WhatsApp)
  const autoCategories = [
    {
      id: "WELCOME",
      label: "Bienvenida",
      description: "Captación 1ra Visita",
      icon: RocketLaunch,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      id: "REFERRAL",
      label: "Referidos",
      description: "Programa de Lealtad",
      icon: UsersThree,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      id: "SEASONAL",
      label: "Promos Mensuales",
      description: "Campañas de Temporada",
      icon: CalendarCheck,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      id: "CLEARANCE",
      label: "Liquidación",
      description: "Outlet de Inventario",
      icon: WarningCircle,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      id: "BIRTHDAY",
      label: "Cumpleaños",
      description: "Cupones de Cumpleaños",
      icon: Cake,
      color: "text-pink-600",
      bg: "bg-pink-50",
    },
    {
      id: "MAINTENANCE",
      label: "Mantenimiento",
      description: "Retoques y Seguimiento",
      icon: FirstAid,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
  ];

  // Sub-módulos manuales: Referidos (global) + una entrada por categoría de procedimiento (BD)
  const manualCategories = [
    {
      id: REFERRALS_ID,
      label: "Referidos",
      description: "Cupones globales compartibles",
      icon: UsersThree,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    ...treatmentCategories.map((cat) => ({
      id: cat.id,
      label: cat.label,
      description: "Cupones presenciales",
      icon: Ticket,
      color: "text-slate-600",
      bg: "bg-slate-100",
    })),
  ];

  const subModules = mode === "MANUAL" ? manualCategories : autoCategories;
  const isReferralView =
    mode === "MANUAL" &&
    currentView === "LIST" &&
    selectedCategory === REFERRALS_ID;

  const handleModeClick = (selectedMode) => {
    setMode(selectedMode);
    setCurrentView("DASHBOARD");
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentView("LIST");
  };

  const handleEdit = (campaign) => {
    setCouponToEdit(campaign);
    setIsModalOpen(true);
  };

  const activeCategoryData =
    subModules.find((c) => c.id === selectedCategory) || subModules[0];

  return (
    <div className="space-y-10 p-4 md:p-8 pb-32 md:pb-8 max-w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-12">
        <div className="space-y-2 text-center md:text-left">
          {mode !== null && (
            <button
              onClick={() =>
                currentView === "LIST"
                  ? setCurrentView("DASHBOARD")
                  : setMode(null)
              }
              className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 hover:gap-3 transition-all"
            >
              <CaretLeft size={16} weight="bold" />{" "}
              {currentView === "LIST" ? "Volver a módulos" : "Volver al inicio"}
            </button>
          )}
          <div className="flex items-center justify-center md:justify-start gap-3">
            <h2 className="text-4xl md:text-6xl font-extrabold italic uppercase text-slate-900 leading-none">
              {mode === null
                ? "Marketing"
                : currentView === "LIST"
                  ? activeCategoryData?.label
                  : mode === "MANUAL"
                    ? "Cupones Manuales"
                    : "Campañas"}
            </h2>
            <HelpButton
              onClick={() => setIsHelpOpen(true)}
              label="Ver ayuda de la sección Marketing"
              size={16}
            />
          </div>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-label">
            {mode === null
              ? "Gestión de Lealtad y Campañas"
              : currentView === "LIST"
                ? activeCategoryData?.description
                : mode === "MANUAL"
                  ? "Entrega presencial por categoría"
                  : "Campañas automáticas por WhatsApp"}
          </p>
        </div>

        {mode !== null && (
          <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
            {mode === "AUTO" ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 active:scale-95"
              >
                <Plus size={20} weight="bold" /> NUEVA CAMPAÑA
              </button>
            ) : isReferralView ? (
              <button
                onClick={() => setIsReferralOpen(true)}
                className="w-full md:w-auto px-8 py-5 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-purple-200 active:scale-95"
              >
                <UsersThree size={20} weight="bold" /> NUEVO REFERIDO
              </button>
            ) : (
              <button
                onClick={() => setIsManualOpen(true)}
                className="w-full md:w-auto px-8 py-5 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:border-indigo-300 hover:text-indigo-600 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"
              >
                <Ticket size={20} weight="bold" /> CUPÓN MANUAL
              </button>
            )}
          </div>
        )}
      </header>

      {mode === null ? (
        <div className="space-y-16 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-6 ml-2">
              Selecciona un Modo
            </h3>
            <section className="grid grid-cols-2 gap-4 md:gap-8">
              {[
                {
                  id: "MANUAL",
                  label: "Cupones Manuales",
                  description: "Entrega presencial por categoría",
                  icon: Ticket,
                  color: "text-indigo-600",
                  bg: "bg-indigo-50",
                },
                {
                  id: "AUTO",
                  label: "Automáticos",
                  description: "Campañas por WhatsApp",
                  icon: RocketLaunch,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleModeClick(m.id)}
                  className="bg-white p-6 md:p-10 rounded-4xl border-2 border-slate-50 transition-all duration-300 flex flex-col items-start gap-4 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:scale-[1.03] active:scale-95 group text-left w-full"
                >
                  <div
                    className={`p-4 rounded-2xl ${m.bg} ${m.color} group-hover:scale-110 transition-transform shrink-0`}
                  >
                    <m.icon size={30} weight="bold" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-xs md:text-sm font-black uppercase tracking-widest text-slate-900 mb-1 truncate">
                      {m.label}
                    </p>
                    <p className="text-xs font-bold text-slate-400 leading-tight wrap-break-word">
                      {m.description}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          </div>

          <div>
            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-6 ml-2 flex items-center gap-2">
              <ChartLineUp size={18} /> Impacto Global (Datos reales)
            </h3>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              {[
                {
                  label: "Conversión 1ra Visita",
                  value: stats.conversion,
                  icon: ChartLineUp,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Referidos Activos",
                  value: stats.referrals,
                  icon: UsersThree,
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  label: "Ahorro Generado",
                  value: stats.savings,
                  icon: HandCoins,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white p-8 md:p-10 rounded-4xl border border-slate-100 flex items-center gap-6 shadow-sm"
                >
                  <div className={`p-5 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={32} weight="fill" />
                  </div>
                  <div>
                    <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                      {stat.label}
                    </p>
                    {loadingStats ? (
                      <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1" />
                    ) : statsError ? (
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mt-1">
                        Sin datos
                      </p>
                    ) : (
                      <p className="text-3xl md:text-4xl font-black text-slate-900">
                        {stat.value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </div>
        </div>
      ) : currentView === "DASHBOARD" ? (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-6 ml-2">
            Selecciona un Módulo
          </h3>
          {subModules.length === 0 ? (
            <div className="text-center py-32 border-2 border-dashed border-slate-200 rounded-4xl bg-white">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                {mode === "MANUAL"
                  ? "No hay categorías de procedimientos configuradas"
                  : "No hay módulos disponibles"}
              </p>
            </div>
          ) : (
            <section className="grid grid-cols-2 gap-4 md:gap-8">
              {subModules.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="bg-white p-6 md:p-8 rounded-4xl border-2 border-slate-50 transition-all duration-300 flex flex-col items-start gap-4 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:scale-[1.03] active:scale-95 group text-left w-full"
                >
                  <div
                    className={`p-4 rounded-2xl ${cat.bg} ${cat.color} group-hover:scale-110 transition-transform shrink-0`}
                  >
                    <cat.icon size={26} weight="bold" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="text-[11px] md:text-xs font-black uppercase tracking-widest text-slate-900 mb-1 truncate">
                      {cat.label}
                    </p>
                    <p className="text-xs font-bold text-slate-400 leading-tight wrap-break-word">
                      {cat.description}
                    </p>
                  </div>
                </button>
              ))}
            </section>
          )}
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-8 duration-300">
          <div className="bg-slate-50/50 rounded-modal border-2 border-slate-50 p-6 md:p-12 min-h-120">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {loadingCampaigns ? (
                <div className="col-span-full text-center py-32">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">
                    Cargando campañas...
                  </p>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-32 col-span-full border-2 border-dashed border-slate-200 rounded-4xl bg-white">
                  <div
                    className={`inline-flex p-6 rounded-3xl ${activeCategoryData.bg} ${activeCategoryData.color} mb-6`}
                  >
                    <activeCategoryData.icon size={48} weight="bold" />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No hay campañas activas de {activeCategoryData.label}
                  </p>
                  <button
                    onClick={() =>
                      isReferralView
                        ? setIsReferralOpen(true)
                        : mode === "MANUAL"
                          ? setIsManualOpen(true)
                          : setIsModalOpen(true)
                    }
                    className="mt-8 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Crear el primero
                  </button>
                </div>
              ) : (
                campaigns.map((campaign) =>
                  isReferralView ? (
                    <ReferralCard
                      key={campaign._id}
                      campaign={campaign}
                      onRefresh={fetchCampaigns}
                    />
                  ) : (
                    <CampaignCard
                      key={campaign._id}
                      campaign={campaign}
                      onRefresh={fetchCampaigns}
                      onEdit={handleEdit}
                    />
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}

      <CouponBuilderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCouponToEdit(null);
        }}
        onRefresh={fetchCampaigns}
        coupon={couponToEdit}
      />

      <ManualCouponModal
        isOpen={isManualOpen}
        defaultCategory={
          mode === "MANUAL" && selectedCategory !== REFERRALS_ID
            ? selectedCategory
            : undefined
        }
        onClose={() => setIsManualOpen(false)}
        onUpdate={fetchCampaigns}
      />

      <ReferralCouponModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        onUpdate={fetchCampaigns}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        title={marketingHelpMeta.title}
        subtitle={marketingHelpMeta.subtitle}
        steps={marketingHelpSteps}
      />
    </div>
  );
}
