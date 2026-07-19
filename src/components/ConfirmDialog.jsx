import { FiAlertTriangle, FiX } from "react-icons/fi";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
  destructive,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition cursor-pointer">
          <FiX className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              destructive
                ? "bg-red-900/40 text-red-400"
                : "bg-cyan-900/40 text-cyan-400"
            }`}>
            <FiAlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            {title || "Confirm"}
          </h3>
        </div>

        {/* Message */}
        <p className="text-sm text-gray-400 mb-6">
          {message || "Are you sure you want to proceed?"}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer">
            {cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition cursor-pointer ${
              destructive
                ? "bg-red-700 hover:bg-red-600 disabled:bg-red-800 disabled:cursor-not-allowed text-white"
                : "bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white"
            }`}>
            {loading ? "Processing…" : confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}