// src/app/components/ui/copy-button.tsx
"use client";

import { useState, useId, useCallback, useEffect } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Display variant: "icon" for icon-only, "text" for icon+text */
  variant?: "icon" | "text";
  /** Label for accessibility and tooltip. Defaults to "Copy" */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Callback fired after successful copy */
  onCopied?: () => void;
}

/**
 * CopyButton — Standardized copy-to-clipboard affordance.
 *
 * Provides consistent hover/focus states, accessible feedback via aria-live="polite",
 * and support for reduced-motion preferences.
 *
 * Usage:
 *   <CopyButton text="0x1234..." variant="icon" />
 *   <CopyButton text="INVOICE_CODE_123" variant="text" label="Copy code" />
 *
 * Features:
 *   - WCAG 2.1 AA compliant keyboard navigation and screen-reader support
 *   - Brief "Copied" cue (1500ms) using aria-live="polite"
 *   - Respects prefers-reduced-motion
 *   - Responsive sizing (sm/md icon, adaptive padding)
 */
export function CopyButton({
  text,
  variant = "icon",
  label = "Copy",
  className = "",
  onCopied,
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const statusId = useId();
  const buttonId = useId();

  // Auto-clear "copied" state after 1500ms
  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [isCopied]);

  const handleCopy = useCallback(async () => {
    try {
      // Use the modern Clipboard API when available
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "absolute";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      onCopied?.();
    } catch {
      // Silently fail — user can manually copy if needed
      console.error("Failed to copy text to clipboard");
    }
  }, [text, onCopied]);

  // Base button classes for consistent styling across variants
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

  // Reduced motion: disable transitions if user prefers
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transitionClasses = prefersReducedMotion ? "duration-0" : "duration-200";

  // Variant-specific styling
  const variantClasses =
    variant === "icon"
      ? // Icon-only: minimal padding, smaller size for tight integration
        "p-1.5 sm:p-2 text-slate-300 hover:text-slate-100 hover:bg-white/8 active:bg-white/12"
      : // Icon+text: button-like appearance with padding and border
        "px-3 py-2 text-sm text-slate-100 border border-white/12 bg-white/6 hover:border-cyan-200/30 hover:bg-white/10 active:bg-white/12";

  // Icon size varies by variant
  const iconSize = variant === "icon" ? 18 : 16;

  // Status message for screen readers
  const statusMessage = isCopied ? `${label}: Copied!` : "";

  return (
    <div className="relative inline-flex">
      <button
        id={buttonId}
        type="button"
        onClick={handleCopy}
        aria-label={isCopied ? `${label}: Copied!` : label}
        aria-describedby={statusId}
        className={`${baseClasses} ${variantClasses} ${transitionClasses} ${className}`}
        title={isCopied ? "Copied!" : label}
      >
        {isCopied ? (
          <Check size={iconSize} className="text-emerald-400" aria-hidden="true" />
        ) : (
          <Copy size={iconSize} aria-hidden="true" />
        )}
        {variant === "text" && (
          <span className={isCopied ? "text-emerald-400" : ""}>{isCopied ? "Copied!" : label}</span>
        )}
      </button>

      {/* Accessible status cue for screen readers using aria-live="polite" */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
    </div>
  );
}
