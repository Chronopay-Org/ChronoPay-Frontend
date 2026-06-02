// src/app/components/ui/button-link.tsx
"use client";

import Link, { type LinkProps } from "next/link";
import { type ComponentProps, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonLinkProps extends Omit<ComponentProps<typeof Link>, "className" | "href"> {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-ring-cyan";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.22)]",
  secondary:
    "border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10",
  ghost:
    "text-cyan-200 hover:bg-cyan-300/10 hover:text-cyan-100",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus:ring-red-400",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  ...props
}: ButtonLinkProps) {
  const isDisabled = disabled || loading;
  return (
    <Link
      href={href}
      {...(props as LinkProps)}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : undefined}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        isDisabled ? "pointer-events-none opacity-60" : ""
      } ${className}`}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </Link>
  );
}
