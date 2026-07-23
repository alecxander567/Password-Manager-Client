import { useState, useCallback, useMemo } from "react";
import { evaluatePasswordStrength } from "../utils/passwordStrength";
import { checkPasswordStrength } from "../api/passwordStrength";

/**
 * Hook for evaluating password strength.
 * Uses client-side evaluation by default, with option to verify server-side.
 *
 * @param {string} password - The password to evaluate
 * @param {object} options
 * @param {boolean} [options.useServer=false] - Whether to also check server-side
 * @returns {{ result: object, loading: boolean, error: string|null, checkServer: function }}
 */
export function usePasswordStrength(password = "", { useServer = false } = {}) {
  const [serverResult, setServerResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clientResult = useMemo(
    () => evaluatePasswordStrength(password),
    [password],
  );

  const result = serverResult || clientResult;

  const checkServer = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await checkPasswordStrength(password);
      setServerResult(res.data);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to check password strength.";
      setError(msg);
      // Fall back to client result
      setServerResult(null);
    } finally {
      setLoading(false);
    }
  }, [password]);

  // Auto-check server side if enabled
  const [autoChecked, setAutoChecked] = useState(false);
  if (useServer && password && !autoChecked && !loading) {
    checkServer();
    setAutoChecked(true);
  }
  if (!password && autoChecked) {
    setAutoChecked(false);
    setServerResult(null);
  }

  return { result, loading, error, checkServer };
}