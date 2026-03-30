import Link from "next/link";
import type { LinkProps } from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

const variantClasses = {
  primary:
    "bg-cyan-300 text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.22)]",
  secondary:
    "border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10",
  ghost:
    "text-cyan-200 hover:bg-cyan-300/10 hover:text-cyan-100",
};

export function ButtonLink({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
