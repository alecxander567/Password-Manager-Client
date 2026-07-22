import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiPlus,
  FiChevronRight,
  FiUnlock,
  FiKey,
} from "react-icons/fi";
import {
  listVaults,
  webauthnAuthOptions,
  webauthnAuthVerify,
} from "../api/vaults";
import { useAuth } from "../hooks/AuthContext";
import { useVaultSession } from "../hooks/VaultSessionContext";
import { importVaultKey } from "../utils/crypto";

function bufToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64ToHex(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Vaults() {
  const { user, logout } = useAuth();
  const { unlock } = useVaultSession();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unlockingVaultId, setUnlockingVaultId] = useState(null);

  useEffect(() => {
    listVaults()
      .then((res) => setVaults(res.data))
      .catch((err) => {
        const msg = err.response?.data?.detail || "Failed to load vaults.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleBiometricUnlock = async (vaultId, e) => {
    e.stopPropagation();
    setUnlockingVaultId(vaultId);
    setError("");

    try {
      const optsRes = await webauthnAuthOptions(vaultId);
      const options = optsRes.data;

      const publicKey = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge), (c) =>
          c.charCodeAt(0),
        ),
        allowCredentials: (options.allowCredentials || []).map((cred) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        })),
      };

      const assertion = await navigator.credentials.get({ publicKey });

      const credentialData = {
        id: assertion.id,
        rawId: bufToBase64Url(assertion.rawId),
        response: {
          clientDataJSON: bufToBase64Url(assertion.response.clientDataJSON),
          authenticatorData: bufToBase64Url(
            assertion.response.authenticatorData,
          ),
          signature: bufToBase64Url(assertion.response.signature),
          userHandle:
            assertion.response.userHandle ?
              bufToBase64Url(assertion.response.userHandle)
            : null,
        },
        type: assertion.type,
        clientExtensionResults: assertion.getClientExtensionResults?.() || {},
      };

      const verifyRes = await webauthnAuthVerify(vaultId, credentialData);

      const vaultKeyB64 = verifyRes.data.vault_key;

      if (!vaultKeyB64) {
        throw new Error(
          "Failed to retrieve vault key from biometric authentication.",
        );
      }

      const vaultKeyHex = base64ToHex(vaultKeyB64);
      const vaultKey = await importVaultKey(vaultKeyHex);

      unlock(vaultKey, Number(vaultId), true);

      navigate(`/vaults/${vaultId}/accounts`);
    } catch (err) {
      console.error("Biometric unlock error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please refresh and try again.");
      } else if (err.response?.status === 400) {
        setError(
          err.response?.data?.error || "Biometric authentication failed.",
        );
      } else if (err.message?.includes("cancel")) {
        setError("");
      } else {
        setError(
          err.message || "Biometric authentication failed. Please try again.",
        );
      }
    } finally {
      setUnlockingVaultId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-800/50 flex items-center justify-center">
              <FiLock className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-white">VaultPass</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer">
              Account
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Vaults</h1>
            <p className="text-gray-400 text-sm mt-1">
              Welcome, {user?.username || "User"}
            </p>
          </div>
          <button
            onClick={() => navigate("/vaults/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer">
            <FiPlus className="w-4 h-4" />
            New Vault
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && vaults.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
              <FiLock className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-300 mb-1">
              No vaults yet
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Create your first vault to start storing passwords securely.
            </p>
            <button
              onClick={() => navigate("/vaults/new")}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer">
              Create Vault
            </button>
          </div>
        )}

        {!loading && vaults.length > 0 && (
          <div className="grid gap-4">
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="w-full flex items-center justify-between p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800/50 transition group">
                <button
                  onClick={() => navigate(`/vaults/${vault.id}/unlock`)}
                  className="flex items-center gap-4 flex-1 text-left cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-800/30 flex items-center justify-center">
                    <FiLock className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{vault.name}</h3>
                    <p className="text-gray-500 text-sm">{vault.category}</p>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  {vault.biometric_enabled && (
                    <button
                      onClick={(e) => handleBiometricUnlock(vault.id, e)}
                      disabled={unlockingVaultId === vault.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-800/30 text-cyan-400 text-sm rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      title="Unlock with biometrics">
                      {unlockingVaultId === vault.id ?
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      : <FiUnlock className="w-4 h-4" />}
                      <span className="hidden sm:inline">
                        {unlockingVaultId === vault.id ?
                          "Unlocking..."
                        : "Biometric"}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/vaults/${vault.id}/unlock`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition cursor-pointer">
                    <FiKey className="w-4 h-4" />
                    <span className="hidden sm:inline">Unlock</span>
                  </button>

                  <FiChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
