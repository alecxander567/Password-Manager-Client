import axiosInstance from "./axios";

/**
 * Generate a secure password via the server-side endpoint.
 *
 * @param {object} options
 * @param {string}  [options.mode="password"] - "password", "pin", or "passphrase"
 * @param {number}  [options.length=20]       - Length (8-128)
 * @param {boolean} [options.use_lowercase=true]
 * @param {boolean} [options.use_uppercase=true]
 * @param {boolean} [options.use_digits=true]
 * @param {boolean} [options.use_special=true]
 * @param {boolean} [options.exclude_confusing=true]
 * @param {number}  [options.min_lowercase]
 * @param {number}  [options.min_uppercase]
 * @param {number}  [options.min_digits]
 * @param {number}  [options.min_special]
 * @param {string}  [options.exclude_chars]
 * @param {number}  [options.word_count]      - For passphrase mode
 * @param {string}  [options.separator]       - For passphrase mode
 * @param {boolean} [options.capitalize]      - For passphrase mode
 * @param {boolean} [options.add_number]      - For passphrase mode
 *
 * @returns {Promise<{password: string, strength: {score: number, strength: string, feedback: string[], entropy: number}}>}
 */
export const generatePassword = (options = {}) => {
  return axiosInstance.post("/api/vaults/password-generate/", options);
};