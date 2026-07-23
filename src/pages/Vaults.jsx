import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiPlus,
  FiChevronRight,
  FiUnlock,
  FiKey,
  FiChevronDown,
  FiSearch,
  FiHeart,
} from "react-icons/fi";
import {
  listVaults,
  webauthnAuthOptions,
  webauthnAuthVerify,
} from "../api/vaults";
import { getCategories } from "../api/categories";
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

export default function Vaults() {
  const { user, logout } = useAuth();
  const { unlock } = useVaultSession();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [unlockingVaultId, setUnlockingVaultId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favoriteIds, favoriteLoading, loadFavorites, toggleFavorite } =
    useFavorites();

  async function handleToggleFavorite(vaultId, e) {
    e.stopPropagation();
    const result = await toggleFavorite(vaultId);
    if (result === "added") {
      setSuccess("Added to favorites.");
    } else if (result === "removed") {
      setSuccess("Removed from favorites.");
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const vaultRes = await listVaults();
        if (cancelled) return;
        setVaults(vaultRes.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || "Failed to load vaults.");
        }
        if (!cancelled) setLoading(false);
        return;
      }

      // Token is now fresh after vaults call succeeded
      try {
        const catRes = await getCategories();
        if (!cancelled) setCategories(catRes.data || []);
      } catch {
        // Categories are optional
      }

      // Load favorites
      if (!cancelled) await loadFavorites();

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Derive unique categories from vaults (fallback if categories API fails)
  const vaultCategories = [
    ...new Set(vaults.map((v) => v.category).filter(Boolean)),
  ].sort();

  // Use API categories if available, otherwise use derived ones
  const allCategories =
    categories.length > 0 ? categories.map((c) => c.name) : vaultCategories;

  // Search & filter logic (combined search + category + favorites)
  const filteredVaults = vaults
    .filter(
      (v) =>
        !searchQuery ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .filter((v) => !selectedCategory || v.category === selectedCategory)
    .filter(
      (v) => !showFavoritesOnly || favoriteIds.has(normalizeFavoriteId(v.id)),
    );

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
      <TopBar onBrandClick={() => navigate("/dashboard")}>
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
      </TopBar>

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

        {loading && (
          <div className="flex justify-center py-16">
            <LoadingSpinner fullPage message="Loading vaults…" />
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

        {/* Search & filter bar */}
        {!loading && vaults.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vaults by name…"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              />
            </div>
            {/* Category filter */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none w-full sm:w-auto px-4 py-2.5 pr-10 bg-gray-900 border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition cursor-pointer">
                <option value="">All Categories</option>
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            {/* Favorites toggle */}
            <button
              onClick={() => setShowFavoritesOnly((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                showFavoritesOnly ?
                  "bg-cyan-600/20 border border-cyan-800/30 text-cyan-400"
                : "bg-gray-900 border border-gray-800 text-gray-400 hover:text-gray-300"
              }`}>
              <FiHeart
                className={`w-4 h-4 ${showFavoritesOnly ? "fill-cyan-400" : ""}`}
              />
              Favorites
            </button>
          </div>
        )}

        {/* No results for search/filter */}
        {!loading && vaults.length > 0 && filteredVaults.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
              <FiSearch className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-300 mb-1">
              No matching vaults
            </h2>
            <p className="text-gray-500 text-sm">
              {searchQuery && selectedCategory ?
                `No vaults named "${searchQuery}" in the selected category.`
              : searchQuery ?
                `No vaults match "${searchQuery}". Try a different name.`
              : "No vaults match the selected category. Try a different category."
              }
            </p>
          </div>
        )}

        {!loading && filteredVaults.length > 0 && (
          <div className="grid gap-4">
            {filteredVaults.map((vault) => (
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
                  {/* Favorite button */}
                  <button
                    onClick={(e) => handleToggleFavorite(vault.id, e)}
                    disabled={favoriteLoading}
                    className={`p-2 rounded-lg transition cursor-pointer ${
                      favoriteIds.has(normalizeFavoriteId(vault.id)) ?
                        "text-cyan-400 hover:text-cyan-300 hover:bg-gray-800"
                      : "text-gray-500 hover:text-cyan-400 hover:bg-gray-800"
                    }`}
                    title={
                      favoriteIds.has(normalizeFavoriteId(vault.id)) ?
                        "Remove from favorites"
                      : "Add to favorites"
                    }>
                    <FiHeart
                      className={`w-4 h-4 ${favoriteIds.has(normalizeFavoriteId(vault.id)) ? "fill-cyan-400" : ""}`}
                    />
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
        )}
      </div>
    </div>
  );
}
