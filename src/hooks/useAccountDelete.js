import { useState } from "react";
import { deleteAccount } from "../api/auth";
import { useNavigate } from "react-router-dom";

export const useAccountDelete = (logout) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");

    try {
      const refreshToken = localStorage.getItem("refresh_token");

      // Attempt to delete the account
      const response = await deleteAccount(refreshToken);

      // Check if we got a successful response (204 or 200)
      if (response.status === 204 || response.status === 200) {
        console.log("Account deleted successfully");

        // Clear ALL local storage and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Call logout to clear the user state
        await logout();

        // Navigate to login page with replace to prevent going back
        navigate("/login", { replace: true });
        return;
      }

      // If we get here, something unexpected happened
      setError("Unexpected response from server.");
      setDeleting(false);
    } catch (err) {
      console.error("Delete account error:", err);

      // Check if the error is due to token (401) - user might already be logged out
      if (err.response?.status === 401) {
        // User is already unauthorized, clear everything and redirect
        localStorage.clear();
        sessionStorage.clear();
        await logout();
        navigate("/login", { replace: true });
        return;
      }

      // Check if it's a 204 response (success) even if it errored
      if (err.response?.status === 204) {

        // Clear ALL local storage
        localStorage.clear();
        sessionStorage.clear();

        await logout();
        navigate("/login", { replace: true });
        return;
      }

      // Handle error response
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === "string") {
          setError(errorData);
        } else if (errorData.error) {
          setError(errorData.error);
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else {
          setError("Failed to delete account. Please try again.");
        }
      } else {
        setError("Failed to delete account. Please try again.");
      }

      setDeleting(false);
    }
  };

  const openConfirm = () => {
    setConfirmDelete(true);
    setError("");
  };

  const closeConfirm = () => {
    setConfirmDelete(false);
    setError("");
  };

  return {
    confirmDelete,
    deleting,
    error,
    openConfirm,
    closeConfirm,
    handleDelete,
  };
};
