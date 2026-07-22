import { useState, useRef, useCallback, useEffect } from "react";
import { VaultSessionContext } from "./VaultSessionContext";

export function VaultSessionProvider({ children }) {
  const [vaultKey, setVaultKey] = useState(null);
  const [vaultId, setVaultId] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const lock = useCallback(() => {
    clearTimer();
    setVaultKey(null);
    setVaultId(null);
  }, [clearTimer]);

  const refreshActivity = useCallback(
    (timeoutMs = 300_000) => {
      clearTimer();
      timerRef.current = setTimeout(() => {
        lock();
      }, timeoutMs);
    },
    [clearTimer, lock],
  );

  const unlock = useCallback(
    (key, id, biometric = false) => {
      setVaultKey(key);
      setVaultId(id);
      setBiometricEnabled(biometric);
      refreshActivity();
    },
    [refreshActivity],
  );

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return (
    <VaultSessionContext.Provider value={{ vaultKey, vaultId, biometricEnabled, unlock, lock, refreshActivity }}>
      {children}
    </VaultSessionContext.Provider>
  );
}