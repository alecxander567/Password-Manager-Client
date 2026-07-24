// components/PasswordStrengthSummary.jsx
import { getStrengthCategory } from "../utils/passwordStrength";

const PasswordStrengthSummary = ({ accounts }) => {
  const stats = accounts.reduce(
    (acc, account) => {
      const category = getStrengthCategory(account.password_strength_label);
      if (category === "strong") acc.strong++;
      else if (category === "medium") acc.medium++;
      else if (category === "weak") acc.weak++;
      return acc;
    },
    { strong: 0, medium: 0, weak: 0 },
  );

  const total = accounts.length;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-4 text-sm mt-1">
      <span className="text-gray-400">Password strength:</span>
      {stats.strong > 0 && (
        <span className="text-green-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-400"></span>
          Strong ({stats.strong})
        </span>
      )}
      {stats.medium > 0 && (
        <span className="text-yellow-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          Medium ({stats.medium})
        </span>
      )}
      {stats.weak > 0 && (
        <span className="text-red-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400"></span>
          Weak ({stats.weak})
        </span>
      )}
    </div>
  );
};

export default PasswordStrengthSummary;
