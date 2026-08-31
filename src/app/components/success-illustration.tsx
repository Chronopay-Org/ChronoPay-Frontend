"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ShieldCheck, Handshake, Gavel } from "lucide-react";

export type SuccessVariant = "mint" | "purchase" | "escrow-release" | "dispute-resolution";

type SuccessIllustrationProps = {
  variant: SuccessVariant;
  alt?: string;
};

/**
 * SuccessIllustration
 *
 * Renders a success/celebration illustration for different milestones.
 * Includes subtle looping animations if the user has not disabled them.
 * Accessible to screen readers via role="img" and aria-label.
 */
export function SuccessIllustration({ variant, alt }: SuccessIllustrationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setPaused(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const config = {
    mint: {
      icon: CheckCircle2,
      label: "Minted",
    },
    purchase: {
      icon: Handshake,
      label: "Purchased",
    },
    "escrow-release": {
      icon: ShieldCheck,
      label: "Released",
    },
    "dispute-resolution": {
      icon: Gavel,
      label: "Resolved",
    },
  };

  const current = config[variant];
  const Icon = current.icon;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt || `${current.label} success illustration`}
      className={`relative h-36 w-full overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--surface)] p-4 ${
        paused ? "es-paused" : ""
      }`}
      style={{
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] es-glow-pulse"
        style={{
          background: "radial-gradient(circle at top, rgba(52, 211, 153, 0.15), transparent 45%)",
        }}
      />

      {/* Accent label */}
      <div
        className="absolute left-5 top-5 rounded-full border px-3 py-1 text-[var(--font-size-xs)] font-[var(--font-weight-semibold)] uppercase tracking-[0.22em]"
        style={{
          color: "var(--success)",
          backgroundColor: "rgba(52, 211, 153, 0.12)",
          borderColor: "rgba(52, 211, 153, 0.2)",
        }}
      >
        {current.label}
      </div>

      {/* Inner card panel */}
      <div
        className="absolute inset-x-6 bottom-6 top-14 flex items-center justify-center gap-4 rounded-[var(--radius-md)] border p-4"
        style={{
          backgroundColor: "var(--surface-strong)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Animated icon box */}
        <div
          className="es-drift-slow flex h-14 w-14 items-center justify-center rounded-[var(--radius-sm)] border border-dashed"
          style={{
            backgroundColor: "var(--background)",
            borderColor: "rgba(52, 211, 153, 0.2)",
          }}
        >
          <Icon className="h-6 w-6" style={{ color: "var(--success)" }} aria-hidden="true" />
        </div>
        
        {/* Decorative skeleton lines */}
        <div className="flex flex-col gap-2">
          <div
            className="h-2 w-16 rounded-full"
            style={{ backgroundColor: "rgba(52, 211, 153, 0.2)" }}
          />
          <div
            className="h-2 w-12 rounded-full"
            style={{ backgroundColor: "var(--border-strong)" }}
          />
        </div>
      </div>
    </div>
  );
}
