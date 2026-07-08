import { ReactNode, ElementType, ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

export interface CardProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: "default" | "panel" | "glass" | "accent";
  interactive?: boolean;
  [key: string]: unknown;
}

export function Card({
  as: Component = "article",
  children,
  className,
  variant = "default",
  interactive = false,
  ...props
}: CardProps & ComponentPropsWithoutRef<typeof Component>) {
  const cardClassName = clsx(
    "card",
    {
      "card--panel": variant === "panel",
      "card--glass": variant === "glass",
      "card--accent": variant === "accent",
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
