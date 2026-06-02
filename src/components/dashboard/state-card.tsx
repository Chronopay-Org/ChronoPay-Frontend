import { useId } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import type { Tone } from "./types";

type StateType = "loading" | "empty" | "error";

const stateTone: Record<StateType, Tone> = {
  loading: "neutral",
  empty: "warning",
  error: "critical",
};

const stateTitle: Record<StateType, string> = {
  loading: "Loading state",
  empty: "Empty state",
  error: "Error state",
};

const stateMessage: Record<StateType, string> = {
  loading: "Use progressive disclosure so the dashboard still feels active while wallet and booking data sync.",
  empty: "Show the next best action when nothing has been listed yet instead of leaving dead space.",
  error: "Call out service failures clearly and keep a retry path visible without hiding the rest of the overview.",
};

export function StateCard({ state }: { state: StateType }) {
  const tone = stateTone[state];
  const stateId = useId();
  const titleId = `${stateId}-title`;
  const messageId = `${stateId}-message`;
  const statusId = `${stateId}-status`;
  const buttonLabel =
    state === "error"
      ? "Retry wallet and booking sync"
      : `Review ${state} dashboard state details`;

  return (
    <Card
      aria-labelledby={titleId}
      aria-describedby={`${messageId} ${statusId}`}
      aria-live={state === "loading" ? "polite" : undefined}
    >
      <CardHeader>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {stateTitle[state]}
          </p>
          <p id={titleId} className="mt-2 text-lg font-semibold text-white">
            {state === "loading"
              ? "Syncing dashboard signals"
              : state === "empty"
                ? "No templates saved yet"
                : "Wallet sync interrupted"}
          </p>
        </div>
        <span
          id={statusId}
          aria-label={`Dashboard state: ${state}`}
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            tone === "neutral"
              ? "bg-sky-400/10 text-sky-100"
              : tone === "warning"
                ? "bg-amber-400/10 text-amber-100"
                : "bg-rose-400/10 text-rose-100"
          }`}
        >
          {state}
        </span>
      </CardHeader>
      <CardBody className="mt-5">
        {state === "loading" ? (
          <>
            <p id={messageId} className="sr-only">
              {stateMessage[state]}
            </p>
            <div className="space-y-3" aria-hidden="true">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-1/2 animate-pulse rounded-full bg-white/10" />
              <div className="h-10 w-full animate-pulse rounded-2xl bg-white/10" />
            </div>
          </>
        ) : (
          <p id={messageId} className="text-sm leading-6 text-slate-300">
            {stateMessage[state]}
          </p>
        )}
      </CardBody>
      <CardFooter className="mt-5">
        <button
          type="button"
          aria-label={buttonLabel}
          aria-describedby={messageId}
          className="inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 px-4 py-2.5 text-sm border border-white/12 bg-white/6 text-slate-100 hover:border-cyan-200/30 hover:bg-white/10"
        >
          {state === "error" ? "Retry sync" : "Review details"}
        </button>
      </CardFooter>
    </Card>
  );
}
