import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiLock,
  FiArrowLeft,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiLogOut,
  FiKey,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import { listAccounts, createAccount, getAccountDetail } from "../api/vaults";
import { encrypt, decrypt } from "../utils/crypto";
import { useVaultSession } from "../hooks/VaultSessionContext";
import EditAccountModal from "../components/EditAccountModal";
import DeleteConfirmDialog from "../components/DeleteConfirmDialog";
import AlertMessage from "../components/AlertMessage";
import { useAccountManagement } from "../hooks/useAccountManagement";

export default function VaultAccounts() {
  const { vaultId } = useParams();
  const navigate = useNavigate();
  const {
    vaultKey,
    vaultId: sessionVaultId,
    lock,
    refreshActivity,
  } = useVaultSession();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add account modal
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ site_name: "", password: "" });
  const [adding, setAdding] = useState(false);

  // View password
  const [viewingId, setViewingId] = useState(null);
  const [decryptedPassword, setDecryptedPassword] = useState("");
  const [revealedId, setRevealedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Re-prompt for viewing
  const [repromptMode, setRepromptMode] = useState(false);
  const [repromptPassword, setRepromptPassword] = useState("");
  const [repromptError, setRepromptError] = useState("");
  const [pendingAccountId, setPendingAccountId] = useState(null);

  // Check if vault is unlocked
  const isUnlocked = vaultKey && sessionVaultId === Number(vaultId);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Loading accounts for vault:", vaultId);
      const res = await listAccounts(vaultId);
      console.log("Accounts loaded:", res.data);
      setAccounts(res.data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
      const msg = err.response?.data?.detail || "Failed to load accounts.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [vaultId]);

  // Load accounts when unlocked
  useEffect(() => {
    if (!isUnlocked) return;
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const res = await listAccounts(vaultId);
        if (!cancelled) setAccounts(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.detail || "Failed to load accounts.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isUnlocked, vaultId]);

  // Redirect if not unlocked after loading check
  useEffect(() => {
    if (!loading && !isUnlocked) {
      navigate(`/vaults/${vaultId}/unlock`, { replace: true });
    }
  }, [loading, isUnlocked, vaultId, navigate]);

  const handleLock = () => {
    lock();
    navigate("/vaults");
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setError("");
    setAdding(true);

    try {
      refreshActivity();

      // Encrypt the password with the vault key
      const { ciphertext, iv } = await encrypt(addForm.password, vaultKey);

      // Send to backend
      await createAccount(vaultId, {
        site_name: addForm.site_name,
        encrypted_password: ciphertext,
        iv_nonce: iv,
      });

      setAddForm({ site_name: "", password: "" });
      setShowAdd(false);
      loadAccounts();
    } catch (err) {
      const msg = err.response?.data?.detail || "Failed to add account.";
      setError(msg);
    } finally {
      setAdding(false);
    }
  };

  const handleViewPassword = async (accountId) => {
    refreshActivity();

    // Re-prompt for security
    setPendingAccountId(accountId);
    setRepromptMode(true);
    setRepromptPassword("");
    setRepromptError("");
  };

  const handleRepromptSubmit = async (e) => {
    e.preventDefault();
    setRepromptError("");

    try {
      refreshActivity();
      const accountId = pendingAccountId;

      // Get the encrypted blob from backend
      const res = await getAccountDetail(vaultId, accountId);
      const account = res.data;

      // Decrypt with vault key
      const plaintext = await decrypt(
        account.encrypted_password,
        account.iv_nonce,
        vaultKey,
      );

      setDecryptedPassword(plaintext);
      setViewingId(accountId);
      setRevealedId(accountId);
      setRepromptMode(false);
      setPendingAccountId(null);
    } catch {
      setRepromptError("Failed to decrypt password.");
    }
  };

  const handleRevealToggle = (accountId) => {
    refreshActivity();
    if (revealedId === accountId) {
      setRevealedId(null);
    } else {
      setRevealedId(accountId);
    }
  };

  const handleCopy = async (text, accountId) => {
    refreshActivity();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(accountId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(accountId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const accountManagement = useAccountManagement(vaultId, loadAccounts);

  // ── Render ──────────────────────────────────────────

  if (!isUnlocked && !loading) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top bar */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/vaults")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer">
            <FiArrowLeft className="w-5 h-5" />
            <span>Vaults</span>
          </button>
          <button
            onClick={handleLock}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer">
            <FiLogOut className="w-4 h-4" />
            Lock Vault
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Accounts</h1>
            <p className="text-gray-400 text-sm mt-1">
              Vault unlocked — tap an account to view its password
            </p>
          </div>
          <button
            onClick={() => {
              refreshActivity();
              setShowAdd(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer">
            <FiPlus className="w-4 h-4" />
            Add Account
          </button>
        </div>

        {/* Error */}
        <AlertMessage type="error" message={error} onClose={() => setError("")} />

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center">
              <FiKey className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-300 mb-1">
              No accounts yet
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Add your first account to this vault.
            </p>
            <button
              onClick={() => {
                refreshActivity();
                setShowAdd(true);
              }}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition cursor-pointer">
              Add Account
            </button>
          </div>
        )}

        {/* Account list */}
        {!loading && accounts.length > 0 && (
          <div className="grid gap-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-600/10 border border-cyan-800/30 flex items-center justify-center">
                        <FiLock className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">
                          {account.site_name}
                        </h3>
                        {viewingId === account.id && (
                          <p className="text-sm font-mono text-gray-300 mt-0.5">
                            {revealedId === account.id ?
                              decryptedPassword
                            : "••••••••"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {viewingId === account.id && (
                        <>
                          <button
                            onClick={() => handleRevealToggle(account.id)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
                            title={revealedId === account.id ? "Hide" : "Show"}>
                            {revealedId === account.id ?
                              <FiEyeOff className="w-4 h-4" />
                            : <FiEye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() =>
                              handleCopy(decryptedPassword, account.id)
                            }
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
                            title="Copy">
                            {copiedId === account.id ?
                              <span className="text-xs text-green-400">
                                Copied!
                              </span>
                            : <FiCopy className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                      {viewingId !== account.id && (
                        <button
                          onClick={() => handleViewPassword(account.id)}
                          className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer">
                          View
                        </button>
                      )}
                      <button
                        onClick={() => accountManagement.handleEditClick(account)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition cursor-pointer"
                        title="Edit">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => accountManagement.handleDeleteClick(account.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition cursor-pointer"
                        title="Delete">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Account Modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  Add Account
                </h2>
                <button
                  onClick={() => setShowAdd(false)}
                  className="text-gray-400 hover:text-white transition cursor-pointer">
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Site / App Name
                  </label>
                  <input
                    type="text"
                    value={addForm.site_name}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        site_name: e.target.value,
                      }))
                    }
                    required
                    placeholder="e.g. GitHub, Gmail"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                    placeholder="Enter the password"
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer">
                    {adding ? "Adding …" : "Add Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        <EditAccountModal
          open={accountManagement.editingId !== null}
          account={accounts.find((a) => a.id === accountManagement.editingId) || null}
          form={accountManagement.editForm}
          onChange={accountManagement.setEditForm}
          onClose={accountManagement.handleCancelEdit}
          onSubmit={(e) => {
            e.preventDefault();
            accountManagement.handleUpdateAccount(vaultKey, refreshActivity);
          }}
          loading={accountManagement.editing}
          error={accountManagement.editError}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          open={accountManagement.deleteId !== null}
          title="Delete Account"
          message="Are you sure you want to delete this account? This action cannot be undone."
          confirmLabel="Delete"
          loading={accountManagement.deleting}
          onConfirm={() => accountManagement.handleDeleteConfirm(refreshActivity)}
          onCancel={accountManagement.handleCancelDelete}
        />

        {/* Re-prompt modal */}
        {repromptMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-6">
                <FiLock className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">
                  Confirm to View
                </h2>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                For security, please re-enter your master password to view this
                password.
              </p>

              {repromptError && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
                  {repromptError}
                </div>
              )}

              <form onSubmit={handleRepromptSubmit} className="space-y-4">
                <input
                  type="password"
                  value={repromptPassword}
                  onChange={(e) => setRepromptPassword(e.target.value)}
                  required
                  placeholder="Master password"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition cursor-pointer">
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRepromptMode(false);
                      setPendingAccountId(null);
                    }}
                    className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition cursor-pointer">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}