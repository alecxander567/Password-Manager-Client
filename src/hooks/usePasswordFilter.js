// hooks/usePasswordFilter.js
import { useState, useMemo } from "react";
import { getStrengthCategory } from "../utils/passwordStrength";

export const usePasswordFilter = (accounts) => {
  const [strengthFilter, setStrengthFilter] = useState("all");

  const filteredAccounts = useMemo(() => {
    if (strengthFilter === "all") {
      return accounts;
    }

    return accounts.filter((account) => {
      const category = getStrengthCategory(account.password_strength_label);
      return category === strengthFilter;
    });
  }, [accounts, strengthFilter]);

  return {
    strengthFilter,
    setStrengthFilter,
    filteredAccounts,
  };
};
