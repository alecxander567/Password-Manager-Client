// components/PasswordStrength.jsx
import { usePasswordStrength } from "../hooks/usePasswordStrength";
import { STRENGTH_COLORS, strengthLabel } from "../utils/passwordStrength";

export default function PasswordStrength({ password }) {
  const { result } = usePasswordStrength(password, { useServer: false });

  if (!password) return null;

  const { score, strength, feedback } = result;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-400">Password strength</span>
        <span className="capitalize text-gray-300">
          {strengthLabel(strength)}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full transition-all ${STRENGTH_COLORS[strength] || "bg-red-500"}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      {feedback.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">{feedback[0]}</p>
      )}
    </div>
  );
}
