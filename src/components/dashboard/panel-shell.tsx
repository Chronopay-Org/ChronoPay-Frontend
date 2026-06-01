import { useId, type ReactNode } from "react";
import { Card, CardHeader, CardBody } from "./card";

export function PanelShell({
  title,
  eyebrow,
  description,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const shellId = useId();
  const titleId = `${shellId}-title`;
  const descriptionId = description ? `${shellId}-description` : undefined;

  return (
    <Card
      as="section"
      variant="panel"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <CardHeader className="flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              {eyebrow}
            </p>
          ) : null}
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-white">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 max-w-2xl text-sm leading-6 text-slate-300"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </CardHeader>
      <CardBody className="pt-5">{children}</CardBody>
    </Card>
  );
}
