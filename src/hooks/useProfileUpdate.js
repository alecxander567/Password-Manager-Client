// hooks/useProfileUpdate.js
import { useState } from "react";
import { updateUserProfile } from "../api/auth";

const extractErrorMessage = (data) => {
  if (data.username) {
    return `Username: ${Array.isArray(data.username) ? data.username[0] : data.username}`;
  }
  if (data.email) {
    return `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
  }
  if (data.bio) {
    return `Bio: ${Array.isArray(data.bio) ? data.bio[0] : data.bio}`;
  }
  if (data.non_field_errors) {
    return Array.isArray(data.non_field_errors) ?
        data.non_field_errors[0]
      : data.non_field_errors;
  }
  if (data.error) {
    return data.error;
  }
  if (data.detail) {
    return data.detail;
  }
  const firstError = Object.values(data).flat()[0];
  return firstError || "Failed to update profile.";
};

export const useProfileUpdate = (user, refreshProfile) => {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const startEditing = () => {
    setEditForm({
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
    });
    setEditing(true);
    setError("");
    setSuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Prepare update data - only include fields that have changed
      const updateData = {};

      if (editForm.username.trim() !== user?.username) {
        updateData.username = editForm.username.trim();
      }

      if (editForm.email.trim() !== user?.email) {
        updateData.email = editForm.email.trim();
      }

      if (editForm.bio.trim() !== user?.bio) {
        updateData.bio = editForm.bio.trim();
      }

      // If no fields changed, don't make the API call
      if (Object.keys(updateData).length === 0) {
        setSuccess("No changes to update.");
        setEditing(false);
        setLoading(false);
        return;
      }

      await updateUserProfile(updateData);
      await refreshProfile();
      setSuccess("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error("Update error:", err.response?.data); 

      const data = err.response?.data;
      if (data && typeof data === "object") {
        setError(extractErrorMessage(data));
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = () => {
    setEditing(false);
    setError("");
    setSuccess("");
  };

  return {
    editing,
    editForm,
    loading,
    error,
    success,
    startEditing,
    handleChange,
    handleSubmit,
    cancelEditing,
  };
};
