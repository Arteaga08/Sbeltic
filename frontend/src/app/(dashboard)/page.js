"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getCategoryFromTreatment } from "@/lib/treatmentCategories";
import AgendaStatusWidget from "@/components/dashboard/AgendaStatusWidget";
import NextSurgeryWidget from "@/components/dashboard/NextSurgeryWidget";
import SmartRefillWidget from "@/components/dashboard/SmartRefillWidget";
import PostOpTrackerWidget from "@/components/dashboard/PostOpTrackerWidget";
import CriticalStockWidget from "@/components/dashboard/CriticalStockWidget";
import MarketingMetricWidget from "@/components/dashboard/MarketingMetricWidget";

const API = process.env.NEXT_PUBLIC_API_URL;

function getCategory(appt) {
  return appt.treatmentCategory || getCategoryFromTreatment(appt.treatmentName);
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [weekAppointments, setWeekAppointments] = useState([]);
  const [postOpAppointments, setPostOpAppointments] = useState([]);
  const [products, setProducts] = useState([]);
  const [couponStats, setCouponStats] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("sbeltic_user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("sbeltic_token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    const twoDaysAgoISO = twoDaysAgo.toISOString();

    async function fetchDashboard() {
      // Fetch 1: Appointments (3 en paralelo, independiente de productos)
      try {
        const [resToday, resWeek, resPostOp] = await Promise.all([
          fetch(`${API}/appointments?date=${todayISO}`, { headers }),
          fetch(`${API}/appointments?date=${todayISO}&days=7`, { headers }),
          fetch(`${API}/appointments?date=${twoDaysAgoISO}&days=2`, { headers }),
        ]);
        const [dataToday, dataWeek, dataPostOp] = await Promise.all([
          resToday.json(),
          resWeek.json(),
          resPostOp.json(),
        ]);
        if (dataToday.success) setTodayAppointments(dataToday.data || []);
        if (dataWeek.success) setWeekAppointments(dataWeek.data || []);
        if (dataPostOp.success) setPostOpAppointments(dataPostOp.data || []);
      } catch {
        toast.error("Error al cargar la agenda");
      }

      // Fetch 2: Productos — independiente (igual que inventory/page.js)
      try {
        const resProducts = await fetch(`${API}/products`, { headers });
        const dataProducts = await resProducts.json();
        if (dataProducts.success) setProducts(dataProducts.data || []);
      } catch {
        // widget muestra estado vacío
      }

      // Fetch 3: Cupones — independiente, requiere ADMIN/RECEPTIONIST
      try {
        const resCoupons = await fetch(`${API}/coupons/stats`, { headers });
        const dataCoupons = await resCoupons.json();
        setCouponStats(
          dataCoupons.success
            ? dataCoupons.data || null
            : { conversionRate: 0, totalReferrals: 0, totalSavings: 0 }
        );
      } catch {
        setCouponStats({ conversionRate: 0, totalReferrals: 0, totalSavings: 0 });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  // Widget 1 — Agenda Status
  const agendaStatus = useMemo(() => {
    const total = todayAppointments.length;
    const confirmed = todayAppointments.filter((a) => a.status === "CONFIRMED").length;
    const pending = todayAppointments.filter((a) => a.status === "PENDING").length;
    const noShow = todayAppointments.filter((a) => a.status === "NO_SHOW").length;
    return { total, confirmed, pending, noShow };
  }, [todayAppointments]);

  // Widget 2 — Next Surgery (próximos 7 días)
  const nextSurgery = useMemo(() => {
    const now = new Date();
    return (
      weekAppointments
        .filter(
          (a) =>
            getCategory(a) === "CIRUGIA" &&
            !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status)
        )
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
        .find((a) => new Date(a.appointmentDate) >= now) || null
    );
  }, [weekAppointments]);

  // Widget 3 — Smart Refill (cancelled slots)
  const cancelledSlots = useMemo(() => {
    return todayAppointments
      .filter((a) => a.status === "CANCELLED")
      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  }, [todayAppointments]);

  // Widget 4 — Post-Op (todas las citas completadas de últimos 2 días)
  const postOpPatients = useMemo(() => {
    return postOpAppointments.filter((a) => a.status === "COMPLETED");
  }, [postOpAppointments]);

  // Widget 5 — Critical Stock (idéntico a UrgentAlerts.jsx)
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.isLowStock || p.hasExpiringBatch);
  }, [products]);

  // Formatted date
  const formattedDate = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h2 className="text-3xl font-bold text-slate-900">
          Hola, {user?.name || "Admin"}
        </h2>
        <p className="text-sm text-slate-400 capitalize">{formattedDate}</p>
      </header>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Row 1 */}
        <AgendaStatusWidget {...agendaStatus} />
        <NextSurgeryWidget surgery={nextSurgery} />
        <SmartRefillWidget cancelledSlots={cancelledSlots} />

        {/* Row 2 */}
        <PostOpTrackerWidget patients={postOpPatients} />
        <CriticalStockWidget products={lowStockProducts} />

        {/* Row 3 */}
        <MarketingMetricWidget stats={couponStats} />
      </div>
    </div>
  );
}
