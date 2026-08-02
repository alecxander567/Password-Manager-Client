import { useState, useCallback, useEffect, useMemo } from "react";
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
  // Tag the server result with the password it was computed for, so a
  // stale result from a previous password is never accidentally shown —
  // no need to actively "reset" it in an effect.
  const [serverResult, setServerResult] = useState(null); // { forPassword, data } | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clientResult = useMemo(
    () => evaluatePasswordStrength(password),
    [password],
  );

  const result = useMemo(() => {
    if (serverResult && serverResult.forPassword === password) {
      return serverResult.data;
    }
    return clientResult;
  }, [serverResult, password, clientResult]);

  const checkServer = useCallback(async () => {
    if (!password) return;
    const forPassword = password;
    setLoading(true);
    setError(null);
    try {
      const res = await checkPasswordStrength(password);
      setServerResult({ forPassword, data: res.data });
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to check password strength.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [password]);

  // Auto-check server side if enabled.
  useEffect(() => {
    if (!useServer || !password) return;

    const id = setTimeout(() => {
      checkServer();
    }, 0);

    return () => clearTimeout(id);
  }, [useServer, password, checkServer]);

  return { result, loading, error, checkServer };
}
