import { useId, type ReactNode } from "react";
import { EmptyStateIllustration } from "./empty-state-illustration";
import { StatusChip } from "./ui/status-chip";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/dashboard";

type EmptyStateCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  accentLabel: string;
  status: {
    label: string;
    tone?: "info" | "warning" | "success" | "danger" | "neutral";
  };
  guidance: string[];
  actions?: ReactNode;
};

export function EmptyStateCard({
  eyebrow,
  title,
  description,
  accentLabel,
  status,
  guidance,
  actions,
}: EmptyStateCardProps) {
  const cardId = useId();
  const titleId = `${cardId}-title`;
  const descriptionId = `${cardId}-description`;
  const statusId = `${cardId}-status`;

  return (
    <Card
      as="section"
      variant="glass"
      aria-labelledby={titleId}
      aria-describedby={`${descriptionId} ${statusId}`}
    >
      <CardHeader className="flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          {eyebrow}
        </p>
        <StatusChip
          id={statusId}
          tone={status.tone}
          aria-label={`${eyebrow} status: ${status.label}`}
        >
          {status.label}
        </StatusChip>
      </CardHeader>
      <CardBody className="mt-4">
        <EmptyStateIllustration accentLabel={accentLabel} />
        <div className="mt-5 space-y-3">
          <h2 id={titleId} className="text-xl font-semibold text-white">
            {title}
          </h2>
          <p id={descriptionId} className="max-w-xl text-sm leading-6 text-slate-300">
            {description}
          </p>
          <ul className="space-y-2 text-sm text-slate-300" aria-label={`${title} guidance`}>
            {guidance.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
      {actions ? (
        <CardFooter className="mt-5 flex flex-wrap gap-3">
          {actions}
        </CardFooter>
      ) : null}
    </Card>
  );
}
