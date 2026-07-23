import axiosInstance from "./axios";

/**
 * Check password strength via the server-side endpoint.
 * @param {string} password - The plaintext password to evaluate
 * @returns {Promise<{score: number, strength: string, feedback: string[], entropy: number}>}
 */
export const checkPasswordStrength = (password) => {
  return axiosInstance.post("/api/vaults/password-strength/", { password });
};