import { FiSave, FiX } from "react-icons/fi";
import { useProfileUpdate } from "../hooks/useProfileUpdate";

const ProfileSettings = ({ user, refreshProfile }) => {
  const {
    editing,
    editForm,
    loading,
    error,
    success,
    startEditing,
    handleChange,
    handleSubmit,
    cancelEditing,
  } = useProfileUpdate(user, refreshProfile);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Profile</h2>
        {!editing && (
          <button
            onClick={startEditing}
            className="px-4 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer">
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-900/40 border border-green-800 text-green-300 text-sm">
          {success}
        </div>
      )}

      {editing ?
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={editForm.username}
              onChange={handleChange}
              autoComplete="username"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
            <p className="mt-1 text-xs text-gray-500">
              Letters, numbers, and @/./+/-/_ characters only.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={editForm.email}
              onChange={handleChange}
              autoComplete="email"
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
            <p className="mt-1 text-xs text-yellow-400">
              Warning: Changing your email will require you to use the new email
              for login.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Bio
            </label>
            <textarea
              name="bio"
              value={editForm.bio}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {editForm.bio?.length || 0}/500 characters
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition cursor-pointer">
              <FiSave className="w-4 h-4" />
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              className="flex items-center gap-2 px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition cursor-pointer">
              <FiX className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      : <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Username
            </p>
            <p className="text-white mt-0.5">{user?.username || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Email
            </p>
            <p className="text-white mt-0.5">{user?.email || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Bio
            </p>
            <p className="text-gray-300 mt-0.5 text-sm">
              {user?.bio || "No bio set."}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">
              Member since
            </p>
            <p className="text-gray-300 mt-0.5 text-sm">
              {user?.created_at ?
                new Date(user.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
            </p>
          </div>
        </div>
      }
    </div>
  );
};

export default ProfileSettings;
