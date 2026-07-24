import { FiKey, FiShield, FiAlertCircle, FiCheckCircle } from "react-icons/fi";

const DashboardStats = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-800 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: "Total Accounts",
      value: stats.total_accounts || 0,
      icon: FiKey,
      color: "text-cyan-400",
      bg: "bg-cyan-600/10",
      border: "border-cyan-800/30",
    },
    {
      label: "Strong Passwords",
      value: stats.strong_count || 0,
      icon: FiCheckCircle,
      color: "text-green-400",
      bg: "bg-green-600/10",
      border: "border-green-800/30",
    },
    {
      label: "Weak Passwords",
      value: stats.weak_count || 0,
      icon: FiAlertCircle,
      color: "text-red-400",
      bg: "bg-red-600/10",
      border: "border-red-800/30",
    },
    {
      label: "Security Score",
      value:
        stats.security_score !== undefined ? `${stats.security_score}%` : "—",
      icon: FiShield,
      color:
        stats.security_score >= 70 ? "text-green-400"
        : stats.security_score >= 40 ? "text-yellow-400"
        : "text-red-400",
      bg:
        stats.security_score >= 70 ? "bg-green-600/10"
        : stats.security_score >= 40 ? "bg-yellow-600/10"
        : "bg-red-600/10",
      border:
        stats.security_score >= 70 ? "border-green-800/30"
        : stats.security_score >= 40 ? "border-yellow-800/30"
        : "border-red-800/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {items.map((item) => (
        <div
          key={item.label}
          className={`bg-gray-900 border ${item.border || "border-gray-800"} rounded-xl p-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                {item.label}
              </p>
              <p className="text-2xl font-bold text-white mt-1">{item.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${item.bg}`}>
              <item.icon className={`w-5 h-5 ${item.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
