import { usePasswordChange } from "../hooks/usePasswordChange";

const SecuritySettings = () => {
  const { form, loading, errors, success, handleChange, handleSubmit } =
    usePasswordChange();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-900/40 border border-green-800 text-green-300 text-sm">
          {success}
        </div>
      )}
      {errors.non_field && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
          {errors.non_field}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Current Password
          </label>
          <input
            type="password"
            name="old_password"
            value={form.old_password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
              errors.old_password ? "border-red-700" : "border-gray-700"
            }`}
          />
          {errors.old_password && (
            <p className="mt-1 text-xs text-red-400">{errors.old_password}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            New Password
          </label>
          <input
            type="password"
            name="new_password"
            value={form.new_password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
              errors.new_password ? "border-red-700" : "border-gray-700"
            }`}
          />
          {errors.new_password && (
            <p className="mt-1 text-xs text-red-400">{errors.new_password}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Confirm New Password
          </label>
          <input
            type="password"
            name="new_password2"
            value={form.new_password2}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className={`w-full px-4 py-2.5 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition ${
              errors.new_password2 ? "border-red-700" : "border-gray-700"
            }`}
          />
          {errors.new_password2 && (
            <p className="mt-1 text-xs text-red-400">{errors.new_password2}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition cursor-pointer">
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default SecuritySettings;
