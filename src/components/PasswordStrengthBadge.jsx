// components/PasswordStrengthBadge.jsx
import {
  getDisplayLabel,
  getStrengthColor,
  getStrengthTextColor,
} from "../utils/passwordStrength";

const PasswordStrengthBadge = ({ label, score, showScore = false }) => {
  const displayLabel = getDisplayLabel(label);
  const colorClass = getStrengthColor(label);
  const textColor = getStrengthTextColor(label);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${textColor} bg-gray-800 border border-gray-700`}>
        <span className={`w-1.5 h-1.5 rounded-full ${colorClass}`}></span>
        {displayLabel}
        {showScore && score !== null && score !== undefined && (
          <span className="text-gray-500">({Math.round(score)}%)</span>
        )}
      </span>
    </div>
  );
};

export default PasswordStrengthBadge;
