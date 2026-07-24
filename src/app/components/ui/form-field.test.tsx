import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormField } from "./form-field";

describe("FormField", () => {
  it("renders label and input correctly", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        inputMode="email"
        type="email"
      />
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("name", "email");
  });

  it("applies correct autocomplete attribute", () => {
    render(
      <FormField
        label="Password"
        autoComplete="current-password"
        name="current-password"
        type="password"
      />
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("autoComplete", "current-password");
  });

  it("applies correct inputMode attribute", () => {
    render(
      <FormField
        label="Phone"
        autoComplete="tel"
        name="phone"
        inputMode="tel"
        type="tel"
      />
    );

    const input = screen.getByLabelText("Phone");
    expect(input).toHaveAttribute("inputMode", "tel");
  });

  it("shows required indicator when required", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        required
      />
    );

    expect(screen.getByLabelText("Email *")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("required");
  });

  it("displays helper text when provided", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        helperText="We'll never share your email"
      />
    );

    expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
  });

  it("displays error message when provided", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        error="Invalid email address"
      />
    );

    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("applies error styling when error is present", () => {
    const { container } = render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        error="Invalid email"
      />
    );

    const input = container.querySelector("input");
    expect(input).toHaveClass("border-rose-400");
  });

  it("associates error message with input via aria-describedby", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        error="Invalid email"
      />
    );

    const input = screen.getByRole("textbox");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    
    const errorElement = document.getElementById(errorId!);
    expect(errorElement).toHaveTextContent("Invalid email");
  });

  it("associates helper text with input via aria-describedby when no error", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        helperText="Enter your email address"
      />
    );

    const input = screen.getByRole("textbox");
    const helperId = input.getAttribute("aria-describedby");
    expect(helperId).toBeTruthy();
    
    const helperElement = document.getElementById(helperId!);
    expect(helperElement).toHaveTextContent("Enter your email address");
  });

  it("generates unique ID when not provided", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input.id).toMatch(/^field-email$/);
  });

  it("uses provided ID when given", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        id="custom-id"
      />
    );

    const input = screen.getByRole("textbox");
    expect(input.id).toBe("custom-id");
  });

  it("forwards ref correctly", () => {
    const ref = { current: null as HTMLInputElement | null };
    
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        ref={ref}
      />
    );

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("handles user input correctly", async () => {
    const user = userEvent.setup();
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        type="email"
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "test@example.com");
    
    expect(input).toHaveValue("test@example.com");
  });

  it("applies custom className", () => {
    const { container } = render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        className="custom-class"
      />
    );

    const input = container.querySelector("input");
    expect(input).toHaveClass("custom-class");
  });

  it("supports disabled state", () => {
    render(
      <FormField
        label="Email"
        autoComplete="email"
        name="email"
        disabled
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("supports password type with proper autocomplete", () => {
    render(
      <FormField
        label="Password"
        autoComplete="new-password"
        name="new-password"
        type="password"
      />
    );

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autoComplete", "new-password");
  });

  it("supports one-time-code for 2FA inputs", () => {
    render(
      <FormField
        label="Verification code"
        autoComplete="one-time-code"
        name="verification-code"
        inputMode="numeric"
        maxLength={6}
      />
    );

    const input = screen.getByLabelText("Verification code");
    expect(input).toHaveAttribute("autoComplete", "one-time-code");
    expect(input).toHaveAttribute("inputMode", "numeric");
    expect(input).toHaveAttribute("maxLength", "6");
  });

  it("warns in development when name/autocomplete pair is incompatible", () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    process.env.NODE_ENV = "development";
    render(
      <FormField
        label="Password"
        autoComplete="current-password"
        name="wrong-name"
        type="password"
      />
    );

    expect(consoleWarn).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });
});
