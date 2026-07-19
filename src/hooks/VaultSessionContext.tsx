import { createContext, useContext } from "react";

export const VaultSessionContext = createContext<{
  vaultKey: CryptoKey | null;
  vaultId: number | null;
  unlock: (key: CryptoKey, id: number) => void;
  lock: () => void;
  refreshActivity: (timeoutMs?: number) => void;
} | null>(null);

export function useVaultSession() {
  const ctx = useContext(VaultSessionContext);
  if (!ctx)
    throw new Error("useVaultSession must be used within VaultSessionProvider");
  return ctx;
}
