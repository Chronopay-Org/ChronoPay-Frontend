import { type ElementType, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  variant?: "default" | "panel" | "glass" | "accent";
  interactive?: boolean;
}

export function Card({
  as: Component = "article",
  children,
  className,
  variant = "default",
  interactive = false,
  ...props
}: CardProps) {
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
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">) {
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
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">) {
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
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">) {
  return (
    <div className={clsx("card-footer", className)} {...props}>
      {children}
    </div>
  );
}
