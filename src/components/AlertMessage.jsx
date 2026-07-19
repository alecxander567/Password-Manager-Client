import { useEffect } from "react";

export default function AlertMessage({ type, message, onClose }) {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      className={`mb-4 p-3 rounded-lg border text-sm flex items-center justify-between gap-3 ${
        isError
          ? "bg-red-900/40 border-red-800 text-red-300"
          : "bg-green-900/40 border-green-800 text-green-300"
      }`}>
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-0.5 rounded hover:bg-black/20 transition cursor-pointer">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}