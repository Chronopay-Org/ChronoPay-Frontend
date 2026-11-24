export interface ErrorContext {
  pathname?: string;
  role?: string;
  digest?: string;
}

export type ErrorReporter = (error: Error, context: ErrorContext) => void;

const defaultReporter: ErrorReporter = (error, context) => {
  if (context.digest) {
    console.error(
      `[ChronoPay] ${error.message} (digest: ${context.digest})`,
      error,
      context,
    );
    return;
  }

  console.error(error, context);
};

let activeReporter: ErrorReporter = defaultReporter;

export function setErrorReporter(reporter?: ErrorReporter | null): void {
  activeReporter = reporter ?? defaultReporter;
}

export function reportError(
  error: Error & { digest?: string },
  context: ErrorContext = {},
): void {
  activeReporter(error, {
    ...context,
    digest: context.digest ?? error.digest,
  });
}
