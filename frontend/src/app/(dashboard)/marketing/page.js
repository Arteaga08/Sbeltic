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
} from "@phosphor-icons/react";
import { toast } from "sonner";

// Modales y Componentes
import CouponBuilderModal from "@/components/marketing/modals/CouponBuilderModal";
import CampaignCard from "@/components/marketing/shared/CampaignCard";

export default function MarketingPage() {
  const [currentView, setCurrentView] = useState("DASHBOARD");
  const [selectedCategory, setSelectedCategory] = useState("WELCOME");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponToEdit, setCouponToEdit] = useState(null);

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
        const token = localStorage.getItem("sbeltic_token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/coupons/stats`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
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
      const token = localStorage.getItem("sbeltic_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/coupons?type=${selectedCategory}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
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

  const categories = [
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

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentView("LIST");
  };

  const handleEdit = (campaign) => {
    setCouponToEdit(campaign);
    setIsModalOpen(true);
  };

  const activeCategoryData = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-10 p-4 md:p-8 pb-32 md:pb-8 max-w-full overflow-x-hidden">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 md:mb-12">
        <div className="space-y-2 text-center md:text-left">
          {currentView === "LIST" && (
            <button
              onClick={() => setCurrentView("DASHBOARD")}
              className="flex items-center justify-center md:justify-start gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-4 hover:gap-3 transition-all"
            >
              <CaretLeft size={16} weight="bold" /> Volver al Dashboard
            </button>
          )}
          <h2 className="text-4xl md:text-6xl font-extrabold italic uppercase text-slate-900 leading-none">
            {currentView === "DASHBOARD"
              ? "Marketing"
              : activeCategoryData.label}
          </h2>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-label">
            {currentView === "DASHBOARD"
              ? "Gestión de Lealtad y Campañas"
              : activeCategoryData.description}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 active:scale-95 shrink-0"
        >
          <Plus size={20} weight="bold" /> NUEVA CAMPAÑA
        </button>
      </header>

      {currentView === "DASHBOARD" ? (
        <div className="space-y-16 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 mb-6 ml-2">
              Selecciona un Módulo
            </h3>
            {/* 🌟 1. WIDGETS MÁS GRANDES EN PC (md:p-10, md:min-h-[180px]) */}
            <section className="grid grid-cols-2 gap-4 md:gap-8">
              {categories.map((cat) => (
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
                    onClick={() => setIsModalOpen(true)}
                    className="mt-8 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Crear la primera
                  </button>
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign._id}
                    campaign={campaign}
                    onRefresh={fetchCampaigns}
                    onEdit={handleEdit}
                  />
                ))
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
    </div>
  );
}
