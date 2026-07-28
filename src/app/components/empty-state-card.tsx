import { useId, type ReactNode } from "react";
import { EmptyStateIllustration } from "./empty-state-illustration";
import { StatusChip } from "./ui/status-chip";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/dashboard";

type EmptyStateCardProps = {
  /** Short eyebrow label shown above the title. Optional — omit for compact usage. */
  eyebrow?: string;
  title: string;
  description: string;
  /** Accent text rendered inside the illustration bubble. Optional. */
  accentLabel?: string;
  /** Status chip shown in the card header. Optional. */
  status?: {
    label: string;
    tone?: "info" | "warning" | "success" | "danger" | "neutral";
  };
  /** Guidance bullet points shown beneath the description. Optional. */
  guidance?: string[];
  /** Action buttons rendered in the card footer. */
  action?: ReactNode;
  /** @deprecated use `action` — kept for backwards compat */
  actions?: ReactNode;
};

export function EmptyStateCard({
  eyebrow,
  title,
  description,
  accentLabel,
  status,
  guidance,
  action,
  actions,
}: EmptyStateCardProps) {
  const cardId = useId();
  const titleId = `${cardId}-title`;
  const descriptionId = `${cardId}-description`;
  const statusId = `${cardId}-status`;

  // Support both `action` (new) and `actions` (legacy) prop names
  const footerContent = action ?? actions;

  return (
    <Card
      as="section"
      variant="glass"
      aria-labelledby={titleId}
      aria-describedby={status ? `${descriptionId} ${statusId}` : descriptionId}
    >
      {(eyebrow || status) && (
        <CardHeader className="flex-wrap items-center justify-between gap-3">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              {eyebrow}
            </p>
          )}
          {status && (
            <StatusChip
              id={statusId}
              tone={status.tone}
              aria-label={eyebrow ? `${eyebrow} status: ${status.label}` : status.label}
            >
              {status.label}
            </StatusChip>
          )}
        </CardHeader>
      )}

      <CardBody className={eyebrow || status ? "mt-4" : undefined}>
        {accentLabel && <EmptyStateIllustration accentLabel={accentLabel} />}
        <div className={accentLabel ? "mt-5 space-y-3" : "space-y-3"}>
          <h2 id={titleId} className="text-xl font-semibold text-white">
            {title}
          </h2>
          <p id={descriptionId} className="max-w-xl text-sm leading-6 text-slate-300">
            {description}
          </p>
          {guidance && guidance.length > 0 && (
            <ul
              className="space-y-2 text-sm text-slate-300"
              aria-label={`${title} guidance`}
            >
              {guidance.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>

      {footerContent && (
        <CardFooter className="mt-5 flex flex-wrap gap-3">
          {footerContent}
        </CardFooter>
      )}
    </Card>
  );
}
