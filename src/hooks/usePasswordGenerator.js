import { useState, useCallback } from "react";
import { generatePassword } from "../api/passwordGenerator";

/**
 * Hook for generating passwords via the server-side endpoint.
 *
 * @returns {{
 *   generatedPassword: string|null,
 *   generatedStrength: object|null,
 *   generating: boolean,
 *   error: string|null,
 *   handleGenerate: function,
 *   copyToClipboard: function,
 *   copied: boolean,
 * }}
 */
export function usePasswordGenerator() {
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [generatedStrength, setGeneratedStrength] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async (options = {}) => {
    setGenerating(true);
    setError(null);
    setCopied(false);
    try {
      const res = await generatePassword(options);
      const { password, strength } = res.data;
      setGeneratedPassword(password);
      setGeneratedStrength(strength || null);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to generate password.";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return {
    generatedPassword,
    generatedStrength,
    generating,
    error,
    handleGenerate,
    copyToClipboard,
    copied,
  };
}