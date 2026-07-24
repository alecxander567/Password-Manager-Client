// components/PasswordStrengthBar.jsx
import {
  getDisplayLabel,
  getStrengthColor,
  getStrengthTextColor,
} from "../utils/passwordStrength";

const PasswordStrengthBar = ({ label, score }) => {
  const displayLabel = getDisplayLabel(label);
  const colorClass = getStrengthColor(label);
  const textColor = getStrengthTextColor(label);

  // Ensure score is between 0 and 100
  const percentage = Math.min(Math.max(score || 0, 0), 100);

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${textColor}`}>{displayLabel}</span>
    </div>
  );
};

export default PasswordStrengthBar;
