import { useState, useEffect } from "react";
import { useAuth } from "../hooks/AuthContext";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "../api/dashboard";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import DashboardStats from "../components/DashboardStats";
import ProfileSettings from "../components/ProfileSettings";
import SecuritySettings from "../components/SecuritySettings";
import DangerZone from "../components/DangerZone";
import CategoriesSection from "../components/CategoriesSection";
import { FiLogOut } from "react-icons/fi";

export default function Dashboard() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Dashboard stats
  const [stats, setStats] = useState({
    total_accounts: 0,
    strong_count: 0,
    medium_count: 0,
    weak_count: 0,
    security_score: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Active section
  const [section, setSection] = useState("profile");

  // Load dashboard stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        const response = await getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to load dashboard stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TopBar maxWidth="max-w-6xl">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer">
          <FiLogOut className="w-4 h-4" />
          Sign Out
        </button>
      </TopBar>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome, {user?.username || "User"}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your account and passwords
          </p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats stats={stats} loading={statsLoading} />

        <div className="grid lg:grid-cols-[220px_1fr] gap-8">
          {/* Sidebar nav */}
          <Sidebar activeSection={section} onSectionChange={setSection} />

          {/* Main content */}
          <div>
            {section === "profile" && (
              <ProfileSettings user={user} refreshProfile={refreshProfile} />
            )}

            {section === "categories" && (
              <CategoriesSection section={section} />
            )}

            {section === "security" && <SecuritySettings />}

            {section === "danger" && <DangerZone logout={logout} />}
          </div>
        </div>
      </div>
    </div>
  );
}
