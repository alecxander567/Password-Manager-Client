import useCategories from "../hooks/useCategories";
import AlertMessage from "./AlertMessage";
import ConfirmDialog from "./ConfirmDialog";
import LoadingSpinner from "./LoadingSpinner";

export default function CategoriesSection({ section }) {
  const {
    categories,
    loading,
    form,
    editingId,
    error,
    success,
    submitting,
    deleteTarget,
    deleting,
    resetForm,
    handleFormChange,
    startEdit,
    handleSubmit,
    requestDelete,
    cancelDelete,
    confirmDelete,
    clearError,
    clearSuccess,
  } = useCategories(section);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Categories</h2>
          <p className="text-sm text-gray-400 mt-1">
            Organize your passwords with custom categories.
          </p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer">
          New Category
        </button>
      </div>

      <AlertMessage type="error" message={error} onClose={clearError} />
      <AlertMessage type="success" message={success} onClose={clearSuccess} />

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            required
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            placeholder="e.g. Finance"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleFormChange}
            rows={3}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition resize-none"
            placeholder="Optional details about this category"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition cursor-pointer">
            {submitting
              ? "Saving..."
              : editingId
                ? "Update Category"
                : "Create Category"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition cursor-pointer">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Your Categories
          </h3>
          <span className="text-xs text-gray-500">
            {categories.length} total
          </span>
        </div>

        {loading ? (
          <LoadingSpinner fullPage message="Loading categories…" />
        ) : categories.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-400">
            No categories yet. Create one to start organizing your vault.
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-800 rounded-lg p-4 bg-gray-950/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-white font-medium">{category.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      {category.description || "No description provided."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition cursor-pointer">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(category.id)}
                      className="px-3 py-1.5 text-sm bg-red-900/50 hover:bg-red-800/60 text-red-300 rounded-lg transition cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleting}
        destructive
      />
    </div>
  );
}
