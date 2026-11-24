import React, { useRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormField } from "@/app/components/ui/form-field";

const baseProps = {
  label: "Password",
  autoComplete: "current-password" as const,
};

describe("FormField", () => {
  describe("Rendering", () => {
    it("renders the label and associates it with the input", () => {
      render(<FormField {...baseProps} />);
      const input = screen.getByLabelText("Password");
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe("INPUT");
    });

    it("defaults type to text", () => {
      render(<FormField {...baseProps} />);
      expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    });

    it("applies the requested type", () => {
      render(<FormField {...baseProps} type="email" />);
      expect(screen.getByLabelText("Password")).toHaveAttribute("type", "email");
    });

    it("renders placeholder without using it as a label", () => {
      render(<FormField {...baseProps} placeholder="Enter a strong password" />);
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("placeholder", "Enter a strong password");
    });

    it("reflects a controlled value", () => {
      render(<FormField {...baseProps} value="s3cret" />);
      expect(screen.getByLabelText("Password")).toHaveValue("s3cret");
    });

    it("appends a custom className to the wrapper", () => {
      const { container } = render(<FormField {...baseProps} className="max-w-sm" />);
      expect(container.firstChild).toHaveClass("max-w-sm");
    });
  });

  describe("Password manager contract", () => {
    it("emits the autocomplete token on the input", () => {
      render(<FormField {...baseProps} />);
      expect(screen.getByLabelText("Password")).toHaveAttribute(
        "autocomplete",
        "current-password"
      );
    });

    it("emits the name attribute for password-manager mapping", () => {
      render(<FormField {...baseProps} name="currentPassword" />);
      expect(screen.getByLabelText("Password")).toHaveAttribute("name", "currentPassword");
    });

    it("emits a numeric inputMode for OTP-style fields", () => {
      render(
        <FormField
          label="Code"
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
        />
      );
      const input = screen.getByLabelText("Code");
      expect(input).toHaveAttribute("inputmode", "numeric");
    });

    it("supports the new-password token for sign-up flows", () => {
      render(
        <FormField
          label="Create password"
          autoComplete="new-password"
          name="newPassword"
        />
      );
      const input = screen.getByLabelText("Create password");
      expect(input).toHaveAttribute("autocomplete", "new-password");
      expect(input).toHaveAttribute("name", "newPassword");
    });
  });

  describe("Generated ids", () => {
    it("auto-generates a stable id when none is provided", () => {
      const { rerender } = render(
        <>
          <FormField label="One" autoComplete="email" />
          <FormField label="Two" autoComplete="email" />
        </>
      );
      const one = screen.getByLabelText("One");
      const two = screen.getByLabelText("Two");
      expect(one.id).toBeTruthy();
      expect(two.id).toBeTruthy();
      expect(one.id).not.toBe(two.id);

      // Re-renders keep the same ids (avoid hydration mismatches).
      rerender(
        <>
          <FormField label="One" autoComplete="email" />
          <FormField label="Two" autoComplete="email" />
        </>
      );
      expect(screen.getByLabelText("One").id).toBe(one.id);
    });

    it("uses an explicit id when provided", () => {
      render(<FormField {...baseProps} id="login-password" />);
      expect(screen.getByLabelText("Password")).toHaveAttribute("id", "login-password");
    });
  });

  describe("Validation and helper text", () => {
    it("shows error text with role=alert and marks the input invalid", () => {
      render(<FormField {...baseProps} error="Passwords do not match" />);
      const input = screen.getByLabelText("Password");
      const error = screen.getByRole("alert");
      expect(error).toHaveTextContent("Passwords do not match");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveAttribute("aria-describedby", error.id);
    });

    it("shows helper text when there is no error and links it via aria-describedby", () => {
      render(<FormField {...baseProps} helperText="At least 8 characters" />);
      const input = screen.getByLabelText("Password");
      const helper = screen.getByText("At least 8 characters");
      expect(input).toHaveAttribute("aria-describedby", helper.id);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("prefers error over helper text", () => {
      render(
        <FormField
          {...baseProps}
          error="Required"
          helperText="Should not show"
        />
      );
      expect(screen.getByRole("alert")).toHaveTextContent("Required");
      expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
    });

    it("renders neither error nor helper when absent", () => {
      render(<FormField {...baseProps} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      const input = screen.getByLabelText("Password");
      expect(input).not.toHaveAttribute("aria-describedby");
    });

    it("applies rose error styling when invalid", () => {
      render(<FormField {...baseProps} error="Invalid" />);
      expect(screen.getByLabelText("Password")).toHaveClass("border-rose-400/40");
      expect(screen.getByLabelText("Password")).toHaveClass("focus-visible:ring-rose-300");
    });

    it("applies cyan styling when valid", () => {
      render(<FormField {...baseProps} />);
      expect(screen.getByLabelText("Password")).toHaveClass("focus-visible:ring-cyan-300");
      expect(screen.getByLabelText("Password")).toHaveClass("border-white/10");
    });
  });

  describe("Interactivity", () => {
    it("calls onChange when the value changes", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FormField {...baseProps} onChange={onChange} />);
      await user.type(screen.getByLabelText("Password"), "x");
      expect(onChange).toHaveBeenCalled();
    });

    it("calls onBlur when the field is blurred", async () => {
      const user = userEvent.setup();
      const onBlur = vi.fn();
      render(<FormField {...baseProps} onBlur={onBlur} />);
      await user.tab();
      await user.tab();
      expect(onBlur).toHaveBeenCalled();
    });

    it("forwards onKeyDown events", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      render(<FormField {...baseProps} onKeyDown={onKeyDown} />);
      await user.type(screen.getByLabelText("Password"), "{Enter}");
      expect(onKeyDown).toHaveBeenCalled();
    });

    it("forwards onPaste events", () => {
      const onPaste = vi.fn((e) => e.preventDefault());
      render(<FormField {...baseProps} onPaste={onPaste} />);
      const input = screen.getByLabelText("Password");
      fireEvent.paste(input, {
        clipboardData: { getData: () => "123456" } as unknown as DataTransfer,
      });
      expect(onPaste).toHaveBeenCalled();
    });
  });

  describe("Native attributes", () => {
    it("marks the field required", () => {
      render(<FormField {...baseProps} required />);
      expect(screen.getByLabelText("Password")).toHaveAttribute("required", "");
    });

    it("disables the input", () => {
      render(<FormField {...baseProps} disabled />);
      expect(screen.getByLabelText("Password")).toBeDisabled();
    });

    it("applies maxLength", () => {
      render(<FormField {...baseProps} maxLength={6} />);
      expect(screen.getByLabelText("Password")).toHaveAttribute("maxlength", "6");
    });

    it("autofocuses the input when requested", () => {
      render(<FormField {...baseProps} autoFocus />);
      expect(screen.getByLabelText("Password")).toHaveFocus();
    });
  });

  describe("Styling", () => {
    it("uses default input classes unless inputClassName is provided", () => {
      render(<FormField {...baseProps} />);
      const input = screen.getByLabelText("Password");
      expect(input.className).toContain("rounded-xl");
      expect(input.className).toContain("focus-visible:ring-2");
    });

    it("replaces default input classes when inputClassName is provided", () => {
      render(
        <FormField
          {...baseProps}
          inputClassName="w-full text-center font-mono bg-slate-950"
        />
      );
      const input = screen.getByLabelText("Password");
      expect(input).toHaveClass("text-center", "font-mono", "bg-slate-950");
      expect(input).not.toHaveClass("rounded-xl");
    });
  });

  describe("Refs", () => {
    it("exposes the underlying input through inputRef", async () => {
      function Harness() {
        const ref = useRef<HTMLInputElement>(null);
        return (
          <>
            <FormField {...baseProps} inputRef={ref} />
            <button onClick={() => ref.current?.focus()}>focus input</button>
          </>
        );
      }
      const user = userEvent.setup();
      render(<Harness />);
      await user.click(screen.getByText("focus input"));
      expect(screen.getByLabelText("Password")).toHaveFocus();
    });
  });
});