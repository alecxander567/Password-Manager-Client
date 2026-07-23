import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiHeart,
  FiChevronRight,
  FiUnlock,
  FiKey,
  FiSearch,
} from "react-icons/fi";
import {
  listVaults,
  webauthnAuthOptions,
  webauthnAuthVerify,
} from "../api/vaults";
import { useAuth } from "../hooks/AuthContext";
import { useVaultSession } from "../hooks/VaultSessionContext";
import { importVaultKey } from "../utils/crypto";
import useFavorites, { normalizeFavoriteId } from "../hooks/useFavorites";
import AlertMessage from "../components/AlertMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import TopBar from "../components/TopBar";

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

export default function Favorites() {
  const { logout } = useAuth();
  const { unlock } = useVaultSession();
  const navigate = useNavigate();
  const [favoriteVaults, setFavoriteVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unlockingVaultId, setUnlockingVaultId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { loadFavorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        // Load vaults first so token gets refreshed if needed
        const vaultRes = await listVaults();
        if (cancelled) return;
        const allVaults = vaultRes.data || [];

        // Then load favorites (token is now fresh)
        const { ids: favoriteVaultIds } = await loadFavorites();
        if (cancelled) return;
        const filtered = allVaults.filter((v) =>
          favoriteVaultIds.has(normalizeFavoriteId(v.id)),
        );
        setFavoriteVaults(filtered);
      } catch (err) {
        if (cancelled) return;
        const msg = err.response?.data?.detail || "Failed to load favorites.";
        setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRemoveFavorite = async (vaultId, e) => {
    e.stopPropagation();
    const result = await toggleFavorite(vaultId);
    if (result === "removed") {
      setFavoriteVaults((prev) => prev.filter((v) => v.id !== vaultId));
      setSuccess("Removed from favorites.");
    } else if (result === null) {
      setError("Failed to remove from favorites.");
    }
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

  // Search filter
  const filteredVaults =
    searchQuery ?
      favoriteVaults.filter((v) =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : favoriteVaults;

  // Re-group after filtering
  const filteredGrouped = filteredVaults.reduce((acc, vault) => {
    const cat = vault.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(vault);
    return acc;
  }, {});

  const filteredSortedCategories = Object.keys(filteredGrouped).sort();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <TopBar
        accent="cyan"
        brandLabel="VaultPass"
        onBrandClick={() => navigate("/dashboard")}>
        <button
          onClick={() => navigate("/vaults")}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer">
          All Vaults
        </button>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer">
          Sign Out
        </button>
      </TopBar>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Favorite Vaults</h1>
            <p className="text-gray-400 text-sm mt-1">
              Your bookmarked vaults for quick access
            </p>
          </div>
        </div>

        <AlertMessage
          type="error"
          message={error}
          onClose={() => setError("")}
        />
        <AlertMessage
          type="success"
          message={success}
          onClose={() => setSuccess("")}
        />

        {/* Search */}
        {!loading && favoriteVaults.length > 0 && (
          <div className="relative mb-6">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search favorites by name…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner fullPage message="Loading favorites…" />
          </div>
        )}

        {!loading && favoriteVaults.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
              <FiHeart className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-300 mb-1">
              No favorites yet
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Go to My Vaults and click the heart icon to bookmark your favorite
              vaults.
            </p>
            <button
              onClick={() => navigate("/vaults")}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer">
              Browse Vaults
            </button>
          </div>
        )}

        {!loading &&
          filteredVaults.length === 0 &&
          favoriteVaults.length > 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
                <FiSearch className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-lg font-medium text-gray-300 mb-1">
                No matching favorites
              </h2>
              <p className="text-gray-500 text-sm">
                No favorites match "{searchQuery}". Try a different search term.
              </p>
            </div>
          )}

        {!loading && filteredVaults.length > 0 && (
          <div className="space-y-8">
            {filteredSortedCategories.map((category) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {category}
                </h2>
                <div className="grid gap-3">
                  {filteredGrouped[category].map((vault) => (
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
                          <h3 className="text-white font-medium">
                            {vault.name}
                          </h3>
                          <p className="text-gray-500 text-sm">
                            {vault.category}
                          </p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleRemoveFavorite(vault.id, e)}
                          className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-gray-800 rounded-lg transition cursor-pointer"
                          title="Remove from favorites">
                          <FiHeart className="w-4 h-4 fill-cyan-400" />
                        </button>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
