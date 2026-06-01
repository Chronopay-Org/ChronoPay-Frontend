import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { Card, CardHeader, CardFooter } from "./card";
import type { QuickAction, Tone } from "./types";

const toneLabels: Record<Tone, string> = {
  neutral: "Available",
  positive: "Ready",
  warning: "Needs review",
  critical: "Needs attention",
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      {actions.map((action) => (
        <Card
          as="div"
          key={action.title}
          interactive
          className="group justify-between"
        >
          <CardHeader>
            <div>
              <h3 className="text-lg font-semibold text-white">{action.title}</h3>
              <p className="helper-text mt-2">
                {action.description}
              </p>
            </div>
            <StatusChip tone={action.tone}>{toneLabels[action.tone]}</StatusChip>
          </CardHeader>
          <CardFooter className="mt-6 flex justify-end">
            <ButtonLink href={action.href} variant="secondary" size="md">
              View {action.title}
            </ButtonLink>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
