import { useNavigate, useLocation } from "react-router-dom";
import {
  FiUser,
  FiTag,
  FiShield,
  FiAlertTriangle,
  FiLock,
} from "react-icons/fi";

const navItems = [
  { key: "profile", label: "Profile", icon: FiUser, section: true },
  { key: "categories", label: "Categories", icon: FiTag, section: true },
  { key: "security", label: "Security", icon: FiShield, section: true },
  { key: "danger", label: "Danger Zone", icon: FiAlertTriangle, section: true },
  { key: "vaults", label: "My Vaults", icon: FiLock, section: false, path: "/vaults" },
];

export default function Sidebar({ activeSection, onSectionChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (item) => {
    if (item.section) {
      onSectionChange(item.key);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.section
          ? activeSection === item.key
          : location.pathname === item.path;

        return (
          <button
            key={item.key}
            onClick={() => handleClick(item)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              isActive
                ? "bg-cyan-600/20 text-cyan-400 border border-cyan-800/50"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}