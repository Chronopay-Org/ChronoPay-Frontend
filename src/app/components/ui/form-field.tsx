"use client";

import React, { forwardRef, InputHTMLAttributes } from "react";
import { clsx } from "clsx";

/**
 * FormField primitive that enforces proper autocomplete, name, and inputmode attributes
 * for password manager and autofill compatibility (WCAG 2.1 AA compliant).
 *
 * @example
 * ```tsx
 * <FormField
 *   type="email"
 *   label="Email address"
 *   autoComplete="email"
 *   name="email"
 *   inputMode="email"
 *   required
 * />
 * ```
 */

// Standard autocomplete values as per HTML5 spec
export type AutocompleteValue =
  | "name"
  | "honorific-prefix"
  | "given-name"
  | "additional-name"
  | "family-name"
  | "honorific-suffix"
  | "nickname"
  | "username"
  | "email"
  | "tel"
  | "tel-country-code"
  | "tel-national"
  | "tel-area-code"
  | "tel-local"
  | "tel-local-prefix"
  | "tel-local-suffix"
  | "tel-extension"
  | "impp"
  | "url"
  | "photo"
  | "bday"
  | "bday-day"
  | "bday-month"
  | "bday-year"
  | "bday-hour"
  | "bday-minute"
  | "bday-second"
  | "bday-full"
  | "sex"
  | "gender-identity"
  | "street-address"
  | "address-line1"
  | "address-line2"
  | "address-line3"
  | "address-level1"
  | "address-level2"
  | "address-level3"
  | "address-level4"
  | "country"
  | "country-name"
  | "postal-code"
  | "cc-name"
  | "cc-given-name"
  | "cc-additional-name"
  | "cc-family-name"
  | "cc-number"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-csc"
  | "cc-type"
  | "transaction-currency"
  | "transaction-amount"
  | "language"
  | "bday"
  | "sex"
  | "one-time-code"
  | "organization-title"
  | "organization"
  | "current-password"
  | "new-password"
  | "off";

// Input mode values for mobile keyboards
export type InputModeValue =
  | "text"
  | "decimal"
  | "numeric"
  | "tel"
  | "search"
  | "email"
  | "url"
  | "none";

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "autoComplete" | "inputMode"> {
  /** Label text for the form field */
  label: string;
  /** HTML5 autocomplete attribute for password manager compatibility */
  autoComplete: AutocompleteValue;
  /** Name attribute (must match or be related to autocomplete value) */
  name: string;
  /** Input mode for mobile keyboard optimization */
  inputMode?: InputModeValue;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message to display */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
}

/**
 * Validates that the name attribute is compatible with the autocomplete value.
 * This helps ensure password managers can correctly identify and fill fields.
 */
function validateNameAutocompletePair(name: string, autoComplete: string): boolean {
  // For password fields, name should contain "password"
  if (autoComplete.includes("password") && !name.toLowerCase().includes("password")) {
    return false;
  }
  
  // For email fields, name should contain "email"
  if (autoComplete === "email" && !name.toLowerCase().includes("email")) {
    return false;
  }
  
  // For username fields, name should contain "username" or "user"
  if (autoComplete === "username" && !name.toLowerCase().includes("user")) {
    return false;
  }
  
  // For one-time-code (2FA), name should contain "code" or "otp"
  if (autoComplete === "one-time-code" && !name.toLowerCase().includes("code") && !name.toLowerCase().includes("otp")) {
    return false;
  }
  
  return true;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      autoComplete,
      name,
      inputMode = "text",
      helperText,
      error,
      required = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    // Validate name/autocomplete pair in development
    if (process.env.NODE_ENV === "development") {
      if (!validateNameAutocompletePair(name, autoComplete)) {
        console.warn(
          `FormField: name="${name}" may not be compatible with autoComplete="${autoComplete}". ` +
          `Password managers work best when name attributes align with autocomplete values.`
        );
      }
    }

    const fieldId = id || `field-${name}`;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    return (
      <div className="space-y-2">
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-slate-200"
        >
          {label}
          {required && <span className="text-rose-400 ml-1" aria-label="required">*</span>}
        </label>
        
        <input
          ref={ref}
          id={fieldId}
          name={name}
          type={props.type || "text"}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={clsx(
            "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3",
            "text-sm text-white placeholder:text-slate-500",
            "focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "transition-colors duration-200",
            error && "border-rose-400 focus:border-rose-400 focus:ring-rose-400",
            className
          )}
          {...props}
        />
        
        {error && (
          <p id={errorId} className="text-xs text-rose-400" role="alert">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p id={helperId} className="helper-text text-xs text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
