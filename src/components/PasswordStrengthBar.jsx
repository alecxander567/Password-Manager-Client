import { STRENGTH_COLORS, strengthLabel } from "../utils/passwordStrength";

/**
 * Compact password strength progress bar for displaying stored
 * password_strength scores on account list items.
 *
 * Props:
 *   score    - number (0-100) from the server's password_strength field
 *   label    - string (optional) from password_strength_label field
 */
export default function PasswordStrengthBar({ score, label }) {
  const resolvedLabel = label || (score != null ? "very_weak" : "unknown");
  const displayScore = score != null ? score : 0;

  return (
    <div className="mt-1 w-full max-w-[200px]">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-700 overflow-hidden">
          <div
            className={`h-full transition-all ${STRENGTH_COLORS[resolvedLabel] || "bg-gray-500"}`}
            style={{ width: `${displayScore}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 capitalize shrink-0">
          {resolvedLabel === "unknown" ? "Not evaluated" : strengthLabel(resolvedLabel)}
        </span>
      </div>
    </div>
  );
}
