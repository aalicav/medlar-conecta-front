"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import DirectorDashboard from "../components/dashboards/DirectorDashboard";
import CommercialDashboard from "../components/dashboards/CommercialDashboard";
import LegalDashboard from "../components/dashboards/LegalDashboard";
import OperationalDashboard from "../components/dashboards/OperationalDashboard";
import FinancialDashboard from "../components/dashboards/FinancialDashboard";
import ProfessionalDashboard from "../components/dashboards/ProfessionalDashboard";
import ClinicDashboard from "../components/dashboards/ClinicDashboard";
import AdminDashboard from "../components/dashboards/AdminDashboard";
import { dashboardService, DashboardStats, Appointment, PendingItem } from "../services/dashboardService";
import { Skeleton, Alert } from "antd";
import { redirect } from "next/navigation";

export default function RoleBasedDashboard() {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [todayAppointmentCount, setTodayAppointmentCount] = useState(0);
  const [suriMessageCount, setSuriMessageCount] = useState(0);
  const [pendingItems, setPendingItems] = useState<Record<string, PendingItem[]>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      redirect("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [statsResponse, appointmentsResponse, todayAppointmentsResponse, suriStatsResponse, pendingItemsResponse] = 
          await Promise.all([
            dashboardService.getStats(),
            dashboardService.getUpcomingAppointments(),
            dashboardService.getTodayAppointments(),
            dashboardService.getSuriStats(),
            dashboardService.getPendingItems()
          ]);
        
        // Update state with fetched data
        setStats(statsResponse.data);
        setUpcomingAppointments(appointmentsResponse.data);
        setTodayAppointmentCount(todayAppointmentsResponse.data.length);
        setSuriMessageCount(suriStatsResponse.data.message_count);
        setPendingItems(pendingItemsResponse.data);
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton active />
        <Skeleton active />
        <Skeleton active />
      </div>
    );
  }

  if (error) {
    return <Alert message="Erro" description={error} type="error" showIcon />;
  }

  // Render the appropriate dashboard based on user role
  if (hasRole(["director"])) {
    return (
      <DirectorDashboard 
        stats={stats || {}} 
        pendingItems={pendingItems} 
        upcomingAppointments={upcomingAppointments}
        loading={loading}
      />
    );
  } else if (hasRole(["commercial_manager"])) {
    return (
      <CommercialDashboard 
        stats={stats || {}} 
        pendingItems={pendingItems}
        loading={loading}
      />
    );
  } else if (hasRole(["legal"])) {
    return (
      <LegalDashboard 
        stats={stats || {}} 
        pendingItems={pendingItems}
        loading={loading}
      />
    );
  } else if (hasRole(["operational"])) {
    return (
      <OperationalDashboard 
        stats={stats || {}} 
        pendingItems={pendingItems}
        upcomingAppointments={upcomingAppointments}
        loading={loading}
      />
    );
  } else if (hasRole(["financial"])) {
    return (
      <FinancialDashboard 
        stats={stats || {}} 
        pendingItems={pendingItems}
        loading={loading}
      />
    );
  } else if (hasRole(["professional"])) {
    return (
      <ProfessionalDashboard 
        stats={stats || {}} 
        upcomingAppointments={upcomingAppointments}
        loading={loading}
      />
    );
  } else if (hasRole(["clinic"])) {
    return (
      <ClinicDashboard 
        stats={stats || {}} 
        upcomingAppointments={upcomingAppointments}
        loading={loading}
      />
    );
  } else if (hasRole(["super_admin", "admin"])) {
    return (
      <AdminDashboard 
        stats={stats} 
        pendingItems={pendingItems}
        upcomingAppointments={upcomingAppointments}
        todayAppointmentCount={todayAppointmentCount}
        suriMessageCount={suriMessageCount}
        loading={loading}
      />
    );
  } else if (hasRole(["plan_admin"])) {
    redirect("/dashboard/health-plans");
    return null;
  }

  // Default fallback
  return (
    <Alert 
      message="Perfil não reconhecido" 
      description="Você não possui um perfil configurado para acessar o dashboard." 
      type="warning" 
      showIcon 
    />
  );
} 