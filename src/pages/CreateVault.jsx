import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiLock, FiArrowLeft, FiUnlock } from "react-icons/fi";
import { createVault, webauthnRegisterOptions, webauthnRegisterVerify } from "../api/vaults";
import { getCategories } from "../api/categories";

// Convert ArrayBuffer to base64url
function bufToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function CreateVault() {
  const navigate = useNavigate();
  const [step, setStep] = useState("form"); // form | biometric | done
  const [form, setForm] = useState({ name: "", category: "", masterPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(false);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategoriesError(true))
      .finally(() => setCategoriesLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Send to backend - backend handles all encryption
      const res = await createVault({
        name: form.name,
        category: form.category,
        master_password: form.masterPassword,
      });

      const vaultId = res.data.id || res.data.vault?.id;

      if (biometricEnabled) {
        setStep("biometric");
        setSubmitting(false);
        // Trigger WebAuthn registration
        await handleBiometricRegister(vaultId);
      } else {
        setStep("done");
        setSubmitting(false);
      }
    } catch (err) {
      const msg = err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        "Failed to create vault.";
      setError(msg);
      setSubmitting(false);
    }
  };

  const handleBiometricRegister = async (vaultId) => {
    setError("");
    setSubmitting(true);

    try {
      // 1. Get registration options from server
      const optsRes = await webauthnRegisterOptions(vaultId);
      const options = optsRes.data;

      // Convert challenge and user.id from base64 to Uint8Array if needed
      const publicKey = {
        ...options,
        challenge: Uint8Array.from(atob(options.challenge), (c) => c.charCodeAt(0)),
        user: {
          ...options.user,
          id: Uint8Array.from(atob(options.user.id), (c) => c.charCodeAt(0)),
        },
        excludeCredentials: (options.excludeCredentials || []).map((cred) => ({
          ...cred,
          id: Uint8Array.from(atob(cred.id), (c) => c.charCodeAt(0)),
        })),
      };

      // 2. Call navigator.credentials.create
      const credential = await navigator.credentials.create({ publicKey });

      // 3. Prepare response for server
      const credentialData = {
        id: credential.id,
        rawId: bufToBase64Url(credential.rawId),
        response: {
          clientDataJSON: bufToBase64Url(credential.response.clientDataJSON),
          attestationObject: bufToBase64Url(credential.response.attestationObject),
        },
        type: credential.type,
        clientExtensionResults: credential.getClientExtensionResults?.() || {},
        transports: credential.response.getTransports?.() || [],
      };

      // 4. Verify with server
      await webauthnRegisterVerify(vaultId, credentialData);

      setStep("done");
      setSubmitting(false);
    } catch (err) {
      const msg = err.message || "Biometric registration failed.";
      setError(msg);
      setSubmitting(false);
    }
  };

  const handleSkipBiometric = () => {
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-green-600/20 border border-green-800/50 flex items-center justify-center">
            <FiLock className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Vault Created!</h1>
          <p className="text-gray-400 mb-8">
            Your vault "{form.name}" has been created successfully.
          </p>
          <button
            onClick={() => navigate("/vaults")}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition cursor-pointer"
          >
            Go to Vaults
          </button>
        </div>
      </div>
    );
  }

  if (step === "biometric") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-md px-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-cyan-600/20 border border-cyan-800/50 flex items-center justify-center animate-pulse">
            <FiUnlock className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Register Biometric
          </h1>
          <p className="text-gray-400 mb-4">
            Follow your device's prompts to register a fingerprint or face unlock
            for quick access to this vault.
          </p>
          {submitting && (
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleSkipBiometric}
            disabled={submitting}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition cursor-pointer disabled:opacity-50"
          >
            Skip Biometric
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <button
            onClick={() => navigate("/vaults")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-800/50 flex items-center justify-center">
            <FiLock className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">New Vault</h1>
            <p className="text-gray-400 text-sm">
              Create a new password vault
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Vault Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Personal, Work, Family"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Category
            </label>
            {categoriesError ? (
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                placeholder="e.g. General, Finance, Social"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
              />
            ) : (
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                disabled={categoriesLoading}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition disabled:opacity-50 appearance-none"
              >
                <option value="" disabled>
                  {categoriesLoading ? "Loading categories…" : "Select a category"}
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Master Password
            </label>
            <input
              type="password"
              name="masterPassword"
              value={form.masterPassword}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            />
            <p className="mt-1 text-xs text-gray-500">
              This password will be used to derive your encryption key. It cannot be recovered if lost.
            </p>
          </div>

          {/* Biometric toggle */}
          <div className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-lg">
            <FiUnlock className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">Enable biometric unlock</p>
              <p className="text-xs text-gray-500">
                Use fingerprint or face to unlock this vault
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={biometricEnabled}
                onChange={(e) => setBiometricEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600" />
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer"
          >
            {submitting ? "Creating Vault …" : "Create Vault"}
          </button>
        </form>
      </div>
    </div>
  );
}