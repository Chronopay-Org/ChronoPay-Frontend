"use client";

import { useId, useState, type FormEvent } from "react";
import {
  getPasswordStrengthLevel,
  PasswordStrengthMeter,
} from "@/app/components/password-strength-meter";

interface ChangePasswordFormProps {
  onChangePassword: (passwords: { current: string; next: string }) => Promise<void>;
}

type FieldName = "current" | "next" | "confirm";
type FieldErrors = Partial<Record<FieldName, string>>;

const inputClassName =
  "w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/30 transition-colors";

export function ChangePasswordForm({ onChangePassword }: ChangePasswordFormProps) {
  const id = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const isStrongEnough = getPasswordStrengthLevel(next).minScore >= 3;

  function validate(): FieldErrors {
    const validationErrors: FieldErrors = {};
    if (!current) validationErrors.current = "Enter your current password.";
    if (!next) {
      validationErrors.next = "Enter a new password.";
    } else if (next === current) {
      validationErrors.next = "Your new password must be different from your current password.";
    } else if (!isStrongEnough) {
      validationErrors.next = "Choose a password rated Strong or Very Strong.";
    }
    if (!confirm) {
      validationErrors.confirm = "Confirm your new password.";
    } else if (confirm !== next) {
      validationErrors.confirm = "Passwords do not match.";
    }
    return validationErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setPending(true);
    try {
      await onChangePassword({ current, next });
      setStatus("Password changed successfully.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (error) {
      setStatus(
        error instanceof Error && error.message
          ? `Unable to change password: ${error.message}`
          : "Unable to change password. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-current`} className="mb-1 block text-sm font-medium text-slate-300">
          Current password
        </label>
        <input
          id={`${id}-current`}
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          disabled={pending}
          required
          aria-invalid={Boolean(errors.current)}
          aria-describedby={errors.current ? `${id}-current-error` : undefined}
          className={inputClassName}
        />
        {errors.current && <p id={`${id}-current-error`} className="mt-1 text-sm text-red-400">{errors.current}</p>}
      </div>

      <div>
        <PasswordStrengthMeter
          label="New password"
          value={next}
          onChange={(value) => setNext(value)}
          disabled={pending}
          required
          describedBy={errors.next ? `${id}-next-error` : undefined}
        />
        {errors.next && (
          <p id={`${id}-next-error`} className="mt-1 text-sm text-red-400">{errors.next}</p>
        )}
      </div>

      <div>
        <label htmlFor={`${id}-confirm`} className="mb-1 block text-sm font-medium text-slate-300">
          Confirm new password
        </label>
        <input
          id={`${id}-confirm`}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          disabled={pending}
          required
          aria-invalid={Boolean(errors.confirm)}
          aria-describedby={errors.confirm ? `${id}-confirm-error` : undefined}
          className={inputClassName}
        />
        {errors.confirm && (
          <p id={`${id}-confirm-error`} className="mt-1 text-sm text-red-400">{errors.confirm}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Changing password..." : "Change password"}
      </button>

      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status}
      </p>
      {status.startsWith("Unable to change password") && (
        <p className="text-sm text-red-400">{status}</p>
      )}
    </form>
  );
}
