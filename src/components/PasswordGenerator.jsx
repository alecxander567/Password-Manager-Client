import { useState } from "react";
import { FiRefreshCw, FiCopy, FiCheck, FiZap } from "react-icons/fi";
import { usePasswordGenerator } from "../hooks/usePasswordGenerator";
import { STRENGTH_COLORS, strengthLabel } from "../utils/passwordStrength";
/**
 * Password generator component with mode/length options and instant strength meter.
 *
 * Props:
 *   onSelectPassword - callback when user clicks "Use This Password"
 *   onClose          - callback to close the generator modal
 */
export default function PasswordGenerator({ onSelectPassword, onClose }) {
  const {
    generatedPassword,
    generatedStrength,
    generating,
    error,
    handleGenerate,
    copyToClipboard,
    copied,
  } = usePasswordGenerator();

  const [mode, setMode] = useState("password");
  const [length, setLength] = useState(20);

  const handleGenerateClick = () => {
    const options = { mode };
    if (mode === "password") {
      options.length = length;
    }
    if (mode === "pin") {
      options.length = Math.min(Math.max(length, 4), 12);
    }
    if (mode === "passphrase") {
      options.word_count = Math.min(Math.max(Math.round(length / 4), 2), 10);
    }
    handleGenerate(options);
  };

  const handleUse = () => {
    if (generatedPassword) {
      onSelectPassword?.(generatedPassword, generatedStrength);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiZap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              Password Generator
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition cursor-pointer">
            ✕
          </button>
        </div>

        {/* Mode selection */}
        <div className="flex gap-2 mb-4">
          {["password", "pin", "passphrase"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition cursor-pointer capitalize ${
                mode === m
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}>
              {m}
            </button>
          ))}
        </div>

        {/* Length slider (for password/pin) */}
        {mode !== "passphrase" && (
          <div className="mb-4">
            <label className="flex items-center justify-between text-sm text-gray-400 mb-1">
              <span>Length: {length}</span>
            </label>
            <input
              type="range"
              min={mode === "pin" ? 4 : 8}
              max={mode === "pin" ? 12 : 128}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{mode === "pin" ? 4 : 8}</span>
              <span>{mode === "pin" ? 12 : 128}</span>
            </div>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerateClick}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition cursor-pointer mb-4">
          <FiRefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          {generating ? "Generating…" : "Generate"}
        </button>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-800 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Generated password display */}
        {generatedPassword && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
              <p className="text-sm font-mono text-white break-all select-all">
                {generatedPassword}
              </p>
              {/* Strength meter */}
              {generatedStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">Strength</span>
                    <span className="capitalize text-gray-300">
                      {strengthLabel(generatedStrength.strength)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full transition-all ${STRENGTH_COLORS[generatedStrength.strength] || "bg-red-500"}`}
                      style={{ width: `${generatedStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(generatedPassword)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition cursor-pointer">
                {copied ?
                  <><FiCheck className="w-4 h-4 text-green-400" /> Copied</>
                : <><FiCopy className="w-4 h-4" /> Copy</>}
              </button>
              <button
                onClick={handleUse}
                className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition cursor-pointer">
                Use This Password
              </button>
            </div>
          </div>
        )}

        {!generatedPassword && (
          <p className="text-center text-gray-500 text-sm">
            Click Generate to create a secure password
          </p>
        )}
      </div>
    </div>
  );
}