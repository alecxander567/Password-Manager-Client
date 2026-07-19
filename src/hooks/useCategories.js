import { useState, useEffect } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedCategories,
} from "../api/categories";

export default function useCategories(section) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Confirm delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (section !== "categories") return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getCategories();
        if (!cancelled) setCategories(res.data || []);
      } catch {
        if (!cancelled) setError("Failed to load categories.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [section]);

  function resetForm() {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setError("");
    setSuccess("");
  }

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function startEdit(category) {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        await updateCategory(editingId, form);
        setSuccess("Category updated successfully!");
      } else {
        await createCategory(form);
        setSuccess("Category created successfully!");
      }
      await loadCategories();
      resetForm();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const first = Object.values(data).flat()[0];
        setError(first || "Unable to save category.");
      } else {
        setError("Unable to save category.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }

  function requestDelete(id) {
    setDeleteTarget(id);
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (deleteTarget === null) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteTarget);
      setSuccess("Category deleted successfully.");
      setDeleteTarget(null);
      await loadCategories();
    } catch {
      setError("Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSeed() {
    setSeeding(true);
    setError("");
    setSuccess("");
    try {
      const res = await seedCategories();
      setSuccess(res.data.message || "Default categories created!");
      await loadCategories();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === "object") {
        const first = Object.values(data).flat()[0];
        setError(first || "Failed to seed categories.");
      } else {
        setError("Failed to seed categories.");
      }
    } finally {
      setSeeding(false);
    }
  }

  function clearError() {
    setError("");
  }

  function clearSuccess() {
    setSuccess("");
  }

  return {
    categories,
    loading,
    form,
    editingId,
    error,
    success,
    submitting,
    deleteTarget,
    deleting,
    seeding,
    resetForm,
    handleFormChange,
    startEdit,
    handleSubmit,
    handleSeed,
    requestDelete,
    cancelDelete,
    confirmDelete,
    clearError,
    clearSuccess,
  };
}