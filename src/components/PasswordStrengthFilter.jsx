// components/PasswordStrengthFilter.jsx
import { FiFilter } from "react-icons/fi";

const STRENGTH_OPTIONS = [
  { value: "all", label: "All Passwords" },
  { value: "strong", label: "Strong", color: "text-green-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "weak", label: "Weak", color: "text-red-400" },
];

const PasswordStrengthFilter = ({ value, onChange, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <FiFilter className="w-4 h-4 text-gray-500" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full sm:w-auto px-4 py-2.5 pr-10 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition cursor-pointer">
          {STRENGTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <span className="text-gray-500">▼</span>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrengthFilter;
