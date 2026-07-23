import { useState, useCallback } from "react";
import {
  updateAccount,
  deleteAccount,
  getVaultDetail,
  webauthnAuthOptions,
  webauthnAuthVerify,
} from "../api/vaults";
import { encrypt } from "../utils/crypto";
import { evaluatePasswordStrength } from "../utils/passwordStrength";

function bufToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function useAccountManagement(vaultId, onSuccess) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ site_name: "", password: "" });
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");
  const [requiresWebAuthn, setRequiresWebAuthn] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [requiresWebAuthnDelete, setRequiresWebAuthnDelete] = useState(false);

  const handleWebAuthnAuthentication = useCallback(async () => {
    try {
      // First check if vault has biometrics enabled
      const vaultRes = await getVaultDetail(vaultId);
      const vault = vaultRes.data;

      if (!vault.biometric_enabled) {
        throw new Error(
          "Biometric authentication is not enabled for this vault. Please enable it in vault settings first.",
        );
      }

      // Get WebAuthn authentication options
      const optionsRes = await webauthnAuthOptions(vaultId);
      const options = optionsRes.data;

      // Convert challenge to Uint8Array
      const publicKey = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge), (c) =>
          c.charCodeAt(0),
        ),
        allowCredentials: (options.allowCredentials || []).map((cred) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        })),
      };

      // Get credential from authenticator
      const credential = await navigator.credentials.get({ publicKey });

      if (!credential) {
        throw new Error("Authentication was cancelled.");
      }

      // Prepare response
      const credentialData = {
        id: credential.id,
        rawId: bufToBase64Url(credential.rawId),
        response: {
          clientDataJSON: bufToBase64Url(credential.response.clientDataJSON),
          authenticatorData: bufToBase64Url(
            credential.response.authenticatorData,
          ),
          signature: bufToBase64Url(credential.response.signature),
          userHandle:
            credential.response.userHandle ?
              bufToBase64Url(credential.response.userHandle)
            : null,
        },
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults?.() || {},
      };

      // Verify credential with server
      const verifyRes = await webauthnAuthVerify(vaultId, credentialData);

      if (!verifyRes.data.verified) {
        throw new Error("WebAuthn verification failed. Please try again.");
      }

      return true;
    } catch (err) {
      console.error("WebAuthn authentication error:", err);

      if (err.response?.status === 400) {
        throw new Error(
          "Biometric authentication is not set up for this vault. " +
            "Please enable biometrics in vault settings first.",
          { cause: err },
        );
      }

      if (err.response?.status === 401) {
        throw new Error(
          "Your session has expired. Please refresh and try again.",
          { cause: err },
        );
      }

      if (err.message?.toLowerCase().includes("cancel")) {
        throw new Error("Authentication was cancelled.", { cause: err });
      }

      throw new Error(
        err.message || "Biometric authentication failed. Please try again.",
        { cause: err },
      );
    }
  }, [vaultId]);

  const handleEditClick = useCallback(
    async (account) => {
      setEditError("");
      setRequiresWebAuthn(false);

      try {
        // Perform WebAuthn authentication
        await handleWebAuthnAuthentication();

        // If successful, proceed with edit
        setEditingId(account.id);
        setEditForm({ site_name: account.site_name, password: "" });
      } catch (err) {
        console.error("Edit click authentication failed:", err);
        setEditError(err.message || "Authentication failed. Please try again.");
      }
    },
    [handleWebAuthnAuthentication],
  );

  const handleUpdateAccount = useCallback(
    async (vaultKey, refreshActivity) => {
      if (!editingId || !vaultKey) return;

      setEditError("");
      setEditing(true);

      try {
        refreshActivity();

        const updateData = {
          site_name: editForm.site_name,
        };

        if (editForm.password.trim() !== "") {
          const { ciphertext, iv } = await encrypt(editForm.password, vaultKey);
          updateData.encrypted_password = ciphertext;
          updateData.iv_nonce = iv;
          updateData.password_strength_score = evaluatePasswordStrength(
            editForm.password,
          ).score;
        }

        await updateAccount(vaultId, editingId, updateData);

        setEditForm({ site_name: "", password: "" });
        setEditingId(null);
        setRequiresWebAuthn(false);
        onSuccess?.();
      } catch (err) {
        console.error("Update account failed:", err);
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to update account.";
        setEditError(msg);
      } finally {
        setEditing(false);
      }
    },
    [vaultId, editingId, editForm, onSuccess],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditForm({ site_name: "", password: "" });
    setEditError("");
    setRequiresWebAuthn(false);
  }, []);

  const handleDeleteClick = useCallback(
    async (accountId) => {
      setDeleteError("");
      setRequiresWebAuthnDelete(false);

      try {
        // Perform WebAuthn authentication
        await handleWebAuthnAuthentication();

        // If successful, proceed with delete
        setDeleteId(accountId);
      } catch (err) {
        console.error("Delete click authentication failed:", err);
        setDeleteError(
          err.message || "Authentication failed. Please try again.",
        );
      }
    },
    [handleWebAuthnAuthentication],
  );

  const handleDeleteConfirm = useCallback(
    async (refreshActivity) => {
      if (!deleteId) return;

      setDeleteError("");
      setDeleting(true);

      try {
        refreshActivity();
        await deleteAccount(vaultId, deleteId);
        setDeleteId(null);
        setRequiresWebAuthnDelete(false);
        onSuccess?.();
      } catch (err) {
        console.error("Delete account failed:", err);
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to delete account.";
        setDeleteError(msg);
        setDeleteId(null);
      } finally {
        setDeleting(false);
      }
    },
    [vaultId, deleteId, onSuccess],
  );

  const handleCancelDelete = useCallback(() => {
    setDeleteId(null);
    setDeleteError("");
    setRequiresWebAuthnDelete(false);
  }, []);

  return {
    editingId,
    editForm,
    setEditForm,
    editing,
    editError,
    requiresWebAuthn,
    handleEditClick,
    handleUpdateAccount,
    handleCancelEdit,
    deleteId,
    deleting,
    deleteError,
    requiresWebAuthnDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    handleCancelDelete,
  };
}
