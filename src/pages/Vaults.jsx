import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiPlus, FiChevronRight, FiUnlock } from "react-icons/fi";
import { listVaults } from "../api/vaults";
import { useAuth } from "../hooks/AuthContext";

export default function Vaults() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-800/50 flex items-center justify-center">
              <FiLock className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="text-lg font-bold text-white">VaultPass</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
            >
              Account
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">My Vaults</h1>
            <p className="text-gray-400 text-sm mt-1">
              Welcome, {user?.username || "User"}
            </p>
          </div>
          <button
            onClick={() => navigate("/vaults/new")}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            New Vault
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Vault list */}
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
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer"
            >
              Create Vault
            </button>
          </div>
        )}

        {/* Vault cards */}
        {!loading && vaults.length > 0 && (
          <div className="grid gap-4">
            {vaults.map((vault) => (
              <button
                key={vault.id}
                onClick={() => navigate(`/vaults/${vault.id}/unlock`)}
                className="w-full flex items-center justify-between p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 hover:bg-gray-800/50 transition text-left cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-600/10 border border-cyan-800/30 flex items-center justify-center">
                    <FiLock className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{vault.name}</h3>
                    <p className="text-gray-500 text-sm">{vault.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {vault.biometric_enabled && (
                    <FiUnlock className="w-4 h-4 text-cyan-500" />
                  )}
                  <FiChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}