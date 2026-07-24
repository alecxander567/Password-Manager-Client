import { FiAlertTriangle } from "react-icons/fi";
import { useAccountDelete } from "../hooks/useAccountDelete";

const DangerZone = ({ logout }) => {
  const {
    confirmDelete,
    deleting,
    error,
    openConfirm,
    closeConfirm,
    handleDelete,
  } = useAccountDelete(logout);

  return (
    <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-red-400 mb-2">Danger Zone</h2>
      <p className="text-gray-400 text-sm mb-6">
        Once you delete your account, there is no going back. Please be certain.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {!confirmDelete ?
        <button
          onClick={openConfirm}
          className="flex items-center gap-2 px-5 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition cursor-pointer">
          <FiAlertTriangle className="w-4 h-4" />
          Delete Account
        </button>
      : <div className="space-y-4">
          <p className="text-red-300 text-sm">
            Are you absolutely sure? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-5 py-2 bg-red-700 hover:bg-red-600 disabled:bg-red-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition cursor-pointer">
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              onClick={closeConfirm}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition cursor-pointer">
              Cancel
            </button>
          </div>
        </div>
      }
    </div>
  );
};

export default DangerZone;
