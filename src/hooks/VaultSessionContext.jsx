import { createContext, useContext } from "react";

export const VaultSessionContext = createContext(null);

export function useVaultSession() {
  const ctx = useContext(VaultSessionContext);
  if (!ctx)
    throw new Error("useVaultSession must be used within VaultSessionProvider");
  return ctx;
}