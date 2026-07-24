// utils/passwordStrength.js

/**
 * Helper functions for password strength display
 * The actual strength evaluation is done by the backend
 */

// Keep the old exports for backward compatibility
export const STRENGTH_COLORS = {
  very_weak: "bg-red-500",
  weak: "bg-orange-500",
  moderate: "bg-yellow-500",
  strong: "bg-green-500",
  very_strong: "bg-emerald-600",
};

export const STRENGTH_THRESHOLDS = [
  { max: 24, label: "very_weak" },
  { max: 49, label: "weak" },
  { max: 69, label: "moderate" },
  { max: 89, label: "strong" },
  { max: 100, label: "very_strong" },
];

export const strengthLabel = (label) =>
  (label || "very_weak").replace("_", " ");

/**
 * Get CSS color class for a strength label
 */
export function getStrengthColor(label) {
  if (!label) return "bg-gray-500";
  const normalized = label.toLowerCase();
  if (normalized === "very_strong" || normalized === "strong") {
    return "bg-green-500";
  }
  if (normalized === "moderate" || normalized === "medium") {
    return "bg-yellow-500";
  }
  return "bg-red-500";
}

/**
 * Get text color class for a strength label
 */
export function getStrengthTextColor(label) {
  if (!label) return "text-gray-400";
  const normalized = label.toLowerCase();
  if (normalized === "very_strong" || normalized === "strong") {
    return "text-green-400";
  }
  if (normalized === "moderate" || normalized === "medium") {
    return "text-yellow-400";
  }
  return "text-red-400";
}

/**
 * Get a user-friendly label from the backend label
 */
export function getDisplayLabel(label) {
  if (!label) return "Unknown";
  const normalized = label.toLowerCase();
  if (normalized === "very_strong" || normalized === "strong") {
    return "Strong";
  }
  if (normalized === "moderate" || normalized === "medium") {
    return "Medium";
  }
  if (normalized === "weak" || normalized === "very_weak") {
    return "Weak";
  }
  return label;
}

/**
 * Get strength category for filtering (strong/medium/weak)
 */
export function getStrengthCategory(label) {
  if (!label) return "unknown";
  const normalized = label.toLowerCase();
  if (normalized === "very_strong" || normalized === "strong") {
    return "strong";
  }
  if (normalized === "moderate" || normalized === "medium") {
    return "medium";
  }
  if (normalized === "weak" || normalized === "very_weak") {
    return "weak";
  }
  return "unknown";
}

/**
 * Evaluate password strength (simple client-side version)
 * This is only used for real-time feedback during password creation/editing
 * The actual strength is stored from the backend
 */
export function evaluatePasswordStrength(password = "") {
  if (!password || password.length === 0) {
    return { score: 0, label: "very_weak" };
  }

  let score = 0;

  // Length scoring
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;
  if (password.length >= 16) score += 20;

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Cap at 100
  score = Math.min(100, score);

  let label = "very_weak";
  if (score >= 90) label = "very_strong";
  else if (score >= 70) label = "strong";
  else if (score >= 50) label = "moderate";
  else if (score >= 25) label = "weak";

  return { score, label };
}

// For backward compatibility, also export as default
export default {
  STRENGTH_COLORS,
  STRENGTH_THRESHOLDS,
  strengthLabel,
  getStrengthColor,
  getStrengthTextColor,
  getDisplayLabel,
  getStrengthCategory,
  evaluatePasswordStrength,
};
