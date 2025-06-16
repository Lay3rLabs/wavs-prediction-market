import React, { useState } from "react";
import { FaCopy, FaCheck } from "react-icons/fa";

interface CopyButtonProps {
  text: string;
  className?: string;
  showText?: boolean;
  size?: "sm" | "md";
  variant?: "pill" | "button" | "icon";
  children?: React.ReactNode;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  className = "",
  showText = false,
  size = "sm",
  variant = "icon",
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const getBaseClasses = () => {
    const baseClasses = "transition-all duration-250 ease-soft cursor-pointer";

    switch (variant) {
      case "pill":
        return `${baseClasses} pill-id ${className}`;
      case "button":
        return `${baseClasses} btn-secondary ${size === "sm" ? "btn-small" : ""} ${className}`;
      case "icon":
      default:
        return `${baseClasses} inline-flex items-center justify-center rounded-lg hover:bg-neutral-800 ${
          size === "sm" ? "w-6 h-6" : "w-8 h-8"
        } ${className}`;
    }
  };

  const getIconSize = () => {
    return size === "sm" ? "w-3 h-3" : "w-4 h-4";
  };

  const getTextClasses = () => {
    return size === "sm" ? "text-body-xs" : "text-body-s";
  };

  return (
    <button
      onClick={handleCopy}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={getBaseClasses()}
      title={copied ? "Copied!" : "Click to copy"}
      type="button"
    >
      <div className="flex items-center gap-2">
        {children && <span className={getTextClasses()}>{children}</span>}

        {showText && !children && (
          <span className={`${getTextClasses()} font-mono truncate max-w-[120px]`}>
            {text}
          </span>
        )}

        <div className="flex items-center justify-center">
          {copied ? (
            <FaCheck
              className={`${getIconSize()} text-success-400 animate-in`}
            />
          ) : (
            <FaCopy
              className={`${getIconSize()} ${
                variant === "icon"
                  ? isHovered
                    ? "text-neutral-300"
                    : "text-neutral-500"
                  : "text-current"
              } transition-colors duration-200`}
            />
          )}
        </div>
      </div>

      {/* Tooltip */}
      {variant === "icon" && (
        <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-neutral-800 text-body-xs text-neutral-200 rounded shadow-lg transition-opacity duration-200 pointer-events-none ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}>
          {copied ? "Copied!" : "Copy"}
        </div>
      )}
    </button>
  );
};

export default CopyButton;
