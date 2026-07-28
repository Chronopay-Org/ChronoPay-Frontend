import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

/**
 * ChronoPay branded loading spinner.
 * Uses a chronograph-inspired ring with reduced-motion support.
 */
export const Spinner = ({
  size = "md",
  className = "",
}: SpinnerProps) => {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-flex ${className}`}
    >
      <svg
        className={`${sizes[size]} animate-spin motion-reduce:animate-pulse text-cyan-500`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
          className="opacity-20"
        />

        {/* Chronograph accent */}
        <path
          d="M12 2
             A10 10 0 0 1 22 12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Small center hub */}
        <circle
          cx="12"
          cy="12"
          r="1.5"
          fill="currentColor"
          className="opacity-80"
        />
      </svg>

      <span className="sr-only">Loading...</span>
    </span>
  );
};