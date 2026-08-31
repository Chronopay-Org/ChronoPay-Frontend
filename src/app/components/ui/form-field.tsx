"use client";

import React, { useId } from "react";

/**
 * Autocomplete tokens we support for authentication and account forms.
 *
 * These map 1:1 to the tokens documented in `docs/password-manager-guide.md`.
 * Restricting the union at the type level means an invalid token is a
 * compile-time error rather than a silent failure, so password managers
 * always receive a token they understand.
 *
 * @see docs/password-manager-guide.md
 */
export type AutocompleteToken =
  | "name"
  | "email"
  | "username"
  | "current-password"
  | "new-password"
  | "one-time-code"
  | "webauthn"
  | "off";

type InputMode = NonNullable<React.InputHTMLAttributes<HTMLInputElement>["inputMode"]>;

export interface FormFieldProps {
  /** Visible label. Always rendered so fields are identifiable (WCAG 3.3.2). */
  label: React.ReactNode;
  /**
   * The autocomplete token for this field. Pairs with `name` so password
   * managers can map form data to stored credentials (WCAG 1.3.5).
   */
  autoComplete: AutocompleteToken;
  /** Optional `name` attribute sent with the form. */
  name?: string;
  /** Optional explicit `id`; auto-generated via `useId` when omitted. */
  id?: string;
  /** Native input type. Defaults to `text`. */
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  /** Raises the correct virtual keyboard (e.g. `numeric` for OTP codes). */
  inputMode?: InputMode;
  /** Native `placeholder`. Never a replacement for `label`. */
  placeholder?: string;
  /** Controlled value. */
  value?: string;
  /** Controlled change handler. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Handles focus leaving the field (e.g. touch-to-validate). */
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  /** Handles Enter/other key events on the field. */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  /** Handles paste into the field (e.g. OTP code normalization). */
  onPaste?: React.ClipboardEventHandler<HTMLInputElement>;
  /** Validation error. Rendered with `role="alert"` and linked via aria-describedby. */
  error?: string | null;
  /** Persistent helper text shown when there is no error. */
  helperText?: string;
  /** Marks the field required and adds the native `required` attribute. */
  required?: boolean;
  /** Optional length cap (used for OTP maxLength). */
  maxLength?: number;
  /** Disables the input. */
  disabled?: boolean;
  /** Autofocuses the field. */
  autoFocus?: boolean;
  /** Programmatic access to the underlying `<input>`. */
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * Custom classes for the underlying `<input>`. When provided these replace
   * the default classes entirely (useful for fields with unique visuals, e.g.
   * the centered monospace OTP input).
   */
  inputClassName?: string;
  /** Additional classes on the wrapping element. */
  className?: string;
}

/**
 * A label + input primitive that enforces `autocomplete` / `name` pairs for
 * authentication and account forms, wiring up error/helper text and ARIA
 * attributes so password managers and assistive technologies work without
 * friction.
 */
export const FormField = ({
  label,
  autoComplete,
  name,
  id: idProp,
  type = "text",
  inputMode,
  placeholder,
  value,
  onChange,
  onBlur,
  onKeyDown,
  onPaste,
  error,
  helperText,
  required = false,
  maxLength,
  disabled = false,
  autoFocus = false,
  inputRef,
  inputClassName,
  className = "",
}: FormFieldProps) => {
  const generatedId = `form-field-${useId()}`;
  const fieldId = idProp ?? generatedId;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const describedBy = error
    ? errorId
    : helperText
      ? helperId
      : undefined;

  return (
    <div className={`space-y-1.5 ${className}`.trim()}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-200">
        {label}
      </label>
      <input
        ref={inputRef}
        id={fieldId}
        name={name}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={
          inputClassName ??
          `w-full rounded-xl border bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            error
              ? "border-rose-400/40 focus-visible:ring-rose-300"
              : "border-white/10 focus-visible:ring-cyan-300"
          }`
        }
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};