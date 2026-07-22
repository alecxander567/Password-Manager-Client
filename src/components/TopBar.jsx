import { FiLock } from "react-icons/fi";

const accentStyles = {
  cyan: {
    icon: "bg-cyan-600/20 border-cyan-800/50 text-cyan-400",
  },
  rose: {
    icon: "bg-rose-600/20 border-rose-800/50 text-rose-400",
  },
};

export default function TopBar({
  maxWidth = "max-w-4xl",
  accent = "cyan",
  brandLabel = "VaultPass",
  brandIcon: BrandIcon = FiLock,
  brandIconClassName = "",
  onBrandClick,
  leftLabel,
  leftIcon: LeftIcon,
  onLeftClick,
  children,
}) {
  const styles = accentStyles[accent] || accentStyles.cyan;
  const hasLeftAction = leftLabel && LeftIcon && onLeftClick;

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <div
        className={`${maxWidth} mx-auto px-4 sm:px-6 h-16 flex items-center ${hasLeftAction ? "justify-between" : "justify-between"}`}>
        {hasLeftAction ?
          <button
            onClick={onLeftClick}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition cursor-pointer">
            <LeftIcon className="w-5 h-5" />
            <span>{leftLabel}</span>
          </button>
        : onBrandClick ?
          <button
            onClick={onBrandClick}
            className="flex items-center gap-3 cursor-pointer">
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center ${styles.icon}`}>
              <BrandIcon className={`w-5 h-5 ${brandIconClassName}`} />
            </div>
            <span className="text-lg font-bold text-white">{brandLabel}</span>
          </button>
        : <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center ${styles.icon}`}>
              <BrandIcon className={`w-5 h-5 ${brandIconClassName}`} />
            </div>
            <span className="text-lg font-bold text-white">{brandLabel}</span>
          </div>
        }
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </header>
  );
}
