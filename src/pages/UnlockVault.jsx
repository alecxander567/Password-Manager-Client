import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiLock, FiKey, FiUnlock, FiArrowLeft } from "react-icons/fi";
import { getVaultDetail, webauthnAuthOptions, webauthnAuthVerify } from "../api/vaults";
import { deriveKey, decryptVaultKey, importVaultKey } from "../utils/crypto";
import { useVaultSession } from "../hooks/VaultSessionContext";

function bufToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function UnlockVault() {
  const { vaultId } = useParams();
  const navigate = useNavigate();
  const { unlock } = useVaultSession();

  const [vault, setVault] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [biometricUnlocking, setBiometricUnlocking] = useState(false);

  useEffect(() => {
    getVaultDetail(vaultId)
      .then((res) => setVault(res.data))
      .catch(() => setError("Failed to load vault details."))
      .finally(() => setLoading(false));
  }, [vaultId]);

  const handlePasswordUnlock = async (e) => {
    e.preventDefault();
    setError("");
    setUnlocking(true);

    try {
      // Derive key from password + salt
      const wrappingKey = await deriveKey(password, vault.kdf_salt);

      // Decrypt the vault key
      if (!vault.iv) {
        throw new Error("Vault encryption data is incomplete. Please recreate this vault.");
      }
      const vaultKeyHex = await decryptVaultKey(
        vault.encrypted_vault_key,
        vault.iv,
        wrappingKey,
      );

      // Import the vault key as a CryptoKey
      const vaultKey = await importVaultKey(vaultKeyHex);

      // Store in session
      unlock(vaultKey, Number(vaultId));

      // Navigate to vault detail
      navigate(`/vaults/${vaultId}/accounts`);
    } catch {
      setError("Invalid master password. Please try again.");
    } finally {
      setUnlocking(false);
    }
  };

  const handleBiometricUnlock = async () => {
    setError("");
    setBiometricUnlocking(true);

    try {
      // 1. Get authentication options
      const optsRes = await webauthnAuthOptions(vaultId);
      const options = optsRes.data;

      // Convert challenge
      const publicKey = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
        allowCredentials: (options.allowCredentials || []).map((cred) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        })),
      };

      // 2. Call navigator.credentials.get
      const assertion = await navigator.credentials.get({ publicKey });

      // 3. Prepare response
      const credentialData = {
        id: assertion.id,
        rawId: bufToBase64Url(assertion.rawId),
        response: {
          clientDataJSON: bufToBase64Url(assertion.response.clientDataJSON),
          authenticatorData: bufToBase64Url(assertion.response.authenticatorData),
          signature: bufToBase64Url(assertion.response.signature),
          userHandle: assertion.response.userHandle
            ? bufToBase64Url(assertion.response.userHandle)
            : null,
        },
        type: assertion.type,
        clientExtensionResults: assertion.getClientExtensionResults?.() || {},
      };

      // 4. Verify with server
      const verifyRes = await webauthnAuthVerify(vaultId, credentialData);

      // 5. The server returns the biometric-encrypted vault key
      // For now, we assume the vault key is returned directly (in production, decrypt with biometric)
      const encryptedVaultKeyBiometric = verifyRes.data.encrypted_vault_key_biometric;
      if (!encryptedVaultKeyBiometric) {
        throw new Error("No biometric vault key returned from server.");
      }

      // Import the vault key (in production, decrypt with biometric-derived key first)
      const vaultKey = await importVaultKey(encryptedVaultKeyBiometric);

      // Store in session
      unlock(vaultKey, Number(vaultId));

      navigate(`/vaults/${vaultId}/accounts`);
    } catch (err) {
      setError(err.message || "Biometric authentication failed.");
    } finally {
      setBiometricUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !vault) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-900/40 border border-red-800 flex items-center justify-center">
            <FiLock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Error</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/vaults")}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition cursor-pointer"
          >
            Back to Vaults
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <button
            onClick={() => navigate("/vaults")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-600/20 border border-cyan-800/50 flex items-center justify-center">
            <FiLock className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">{vault?.name}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Unlock this vault to access your passwords
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Master password unlock */}
        <form onSubmit={handlePasswordUnlock} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your master password"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={unlocking}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer"
          >
            <FiKey className="w-4 h-4" />
            {unlocking ? "Unlocking …" : "Unlock with Password"}
          </button>
        </form>

        {/* Biometric unlock */}
        {vault?.biometric_enabled && (
          <div className="border-t border-gray-800 pt-6">
            <button
              onClick={handleBiometricUnlock}
              disabled={biometricUnlocking}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-200 font-medium rounded-lg transition cursor-pointer"
            >
              <FiUnlock className="w-4 h-4" />
              {biometricUnlocking ? "Authenticating …" : "Unlock with Biometric"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}