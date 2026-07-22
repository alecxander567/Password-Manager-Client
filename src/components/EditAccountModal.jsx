import { FiX } from "react-icons/fi";

export default function EditAccountModal({
  open,
  account,
  form,
  onChange,
  onClose,
  onSubmit,
  loading,
  error,
}) {
  if (!open || !account) return null;

  const isWebAuthnError =
    error?.includes("biometric") || error?.includes("WebAuthn");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Edit Account</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition cursor-pointer">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              isWebAuthnError ?
                "bg-yellow-900/40 border border-yellow-800 text-yellow-300"
              : "bg-red-900/40 border border-red-800 text-red-300"
            }`}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Site / App Name
            </label>
            <input
              type="text"
              value={form.site_name}
              onChange={(e) =>
                onChange({
                  ...form,
                  site_name: e.target.value,
                })
              }
              required
              placeholder="e.g. GitHub, Gmail"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                onChange({
                  ...form,
                  password: e.target.value,
                })
              }
              placeholder="Enter new password"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || isWebAuthnError}
              className={`flex-1 py-2.5 text-white font-medium rounded-lg transition ${
                isWebAuthnError ?
                  "bg-gray-700 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed cursor-pointer"
              }`}>
              {loading ? "Updating …" : "Update Account"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
