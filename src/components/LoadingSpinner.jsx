export default function LoadingSpinner({ size = "md", message, fullPage }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  const spinner = (
    <div
      className={`animate-spin rounded-full border-gray-700 border-t-cyan-400 ${sizeClasses[size] || sizeClasses.md}`}
    />
  );

  // Full-page overlay for data-loading states
  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        {spinner}
        {message && <p className="text-sm text-gray-400">{message}</p>}
      </div>
    );
  }

  // Inline spinner (button states, small indicators)
  if (!message) {
    return spinner;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      {spinner}
      <span>{message}</span>
    </div>
  );
}