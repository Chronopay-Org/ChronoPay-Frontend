import { type ElementType, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";
import { SocialProofBadges } from "./social-proof-badges";
import type { SocialProofBadgeEntry } from "./types";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: "default" | "panel" | "glass" | "accent" | "compact-list";
  interactive?: boolean;
}

export function Card<T extends ElementType = "article">({
  as,
  children,
  className,
  variant = "default",
  interactive = false,
  ...props
}: CardProps & ComponentPropsWithoutRef<T>) {
  const Component = as || "article";
  const cardClassName = clsx(
    "card",
    {
      "card--panel": variant === "panel",
      "card--glass": variant === "glass",
      "card--accent": variant === "accent",
      "card--compact-list": variant === "compact-list",
      "card--interactive": interactive,
    },
    className
  );

  return (
    <Component className={cardClassName} {...props}>
      {children}
    </Component>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div className={clsx("card-header", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div className={clsx("card-body", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div className={clsx("card-footer", className)} {...props}>
      {children}
    </div>
  );
}

export interface SupplierCardHeaderProps {
  name: string;
  title?: string;
  badges?: SocialProofBadgeEntry[];
  maxBadgesVisible?: number;
  className?: string;
}

export function SupplierCardHeader({
  name,
  title,
  badges = [],
  maxBadgesVisible = 3,
  className,
}: SupplierCardHeaderProps) {
  return (
    <CardHeader
      className={clsx(
        "flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <h3
          className="truncate text-base font-semibold text-white sm:text-lg"
          title={name}
        >
          {name}
        </h3>
        {title ? (
          <p
            className="truncate text-xs text-slate-300 sm:text-sm"
            title={title}
          >
            {title}
          </p>
        ) : null}
      </div>
      {badges.length > 0 ? (
        <SocialProofBadges
          badges={badges}
          maxVisible={maxBadgesVisible}
          className="shrink-0"
        />
      ) : null}
    </CardHeader>
  );
}
