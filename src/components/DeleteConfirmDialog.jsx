import { FiAlertTriangle } from "react-icons/fi";

export default function DeleteConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading,
  error,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const isWebAuthnError =
    error?.includes("biometric") || error?.includes("WebAuthn");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-900/40 border border-red-800 flex items-center justify-center">
            <FiAlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>

        <p className="text-gray-400 text-sm mb-4">{message}</p>

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

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading || isWebAuthnError}
            className={`flex-1 py-2.5 text-white font-medium rounded-lg transition ${
              isWebAuthnError ?
                "bg-gray-700 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed cursor-pointer"
            }`}>
            {loading ? "Deleting …" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
