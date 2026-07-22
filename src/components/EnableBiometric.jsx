import { useState } from "react";
import {
  webauthnRegisterOptions,
  webauthnRegisterVerify,
  unlockVault,
} from "../api/vaults";

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

export default function EnableBiometric({
  vaultId,
  onSuccess,
  onError,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);
  const [masterPassword, setMasterPassword] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [error, setError] = useState("");

  const handleEnableBiometric = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Unlock the vault and establish the server-side key handoff
      await unlockVault(vaultId, masterPassword);

      // Step 2: Get registration options from server
      const optsRes = await webauthnRegisterOptions(vaultId);
      const options = optsRes.data;

      // Step 3: Convert the options for the WebAuthn API
      const publicKey = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge), (c) =>
          c.charCodeAt(0),
        ),
        user: {
          ...options.user,
          id: Uint8Array.from(atob(options.user.id), (c) => c.charCodeAt(0)),
        },
        excludeCredentials: (options.excludeCredentials || []).map((cred) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        })),
      };

      // Step 4: Create the credential using WebAuthn API
      const credential = await navigator.credentials.create({ publicKey });

      // Step 5: Prepare the credential data to send to server
      const credentialData = {
        id: credential.id,
        rawId: bufToBase64Url(credential.rawId),
        response: {
          clientDataJSON: bufToBase64Url(credential.response.clientDataJSON),
          attestationObject: bufToBase64Url(
            credential.response.attestationObject,
          ),
        },
        type: credential.type,
      };

      // Step 6: Verify registration with server
      await webauthnRegisterVerify(vaultId, credentialData);

      // Success
      setShowPasswordPrompt(false);
      setMasterPassword("");
      if (onSuccess) {
        onSuccess("Biometric authentication enabled successfully!");
      }
    } catch (err) {
      console.error("Biometric registration error:", err);

      // Handle specific error cases
      if (err.response?.status === 400) {
        setError(
          err.response?.data?.error ||
            "Bad request. Please check your master password and try again.",
        );
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please refresh and try again.");
      } else {
        setError(err.message || "Failed to enable biometric authentication.");
      }

      if (onError) {
        onError(err.message || "Failed to enable biometric authentication.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!showPasswordPrompt) {
    return (
      <div className="text-center">
        <div className="mb-4 p-4 bg-green-900/20 border border-green-800 rounded-lg">
          <p className="text-green-400">
            Biometric authentication is now enabled!
          </p>
          <p className="text-gray-400 text-sm mt-1">
            You can now unlock this vault with your fingerprint or face ID.
          </p>
        </div>
        <button
          onClick={() => {
            setShowPasswordPrompt(true);
            setError("");
          }}
          className="text-sm text-cyan-400 hover:text-cyan-300 transition cursor-pointer">
          Re-enable biometrics
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="ml-4 text-sm text-gray-400 hover:text-gray-300 transition cursor-pointer">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Enter your master password to enable biometrics
        </label>
        <input
          type="password"
          value={masterPassword}
          onChange={(e) => setMasterPassword(e.target.value)}
          placeholder="Master password"
          autoComplete="current-password"
          className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
          onKeyDown={(e) => {
            if (e.key === "Enter" && masterPassword) {
              handleEnableBiometric();
            }
          }}
        />
      </div>

      <button
        onClick={handleEnableBiometric}
        disabled={loading || !masterPassword}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer">
        {loading ?
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Enabling...
          </>
        : "Enable Biometric Unlock"}
      </button>

      <p className="text-xs text-gray-500 text-center">
        You will only need to enter your master password once to set up
        biometrics. After that, you can unlock with your fingerprint or face ID.
      </p>
    </div>
  );
}
