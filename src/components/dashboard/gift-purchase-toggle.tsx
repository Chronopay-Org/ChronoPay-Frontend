"use client";

import { useId, useState } from "react";
import { Gift, Mail, Link2, QrCode, Smile, AlertCircle, Check } from "lucide-react";

export interface GiftDetails {
  isGift: boolean;
  recipientName: string;
  recipientEmail: string;
  message: string;
  handoffMethod: "email" | "link" | "qr";
}

interface GiftPurchaseToggleProps {
  onChange?: (details: GiftDetails) => void;
}

const MESSAGE_LIMIT = 240;
const EMOJI_OPTIONS = ["🎁", "🎉", "✨", "⏳", "💫", "🙌", "❤️", "🥳"];

const HANDOFF_OPTIONS: {
  value: GiftDetails["handoffMethod"];
  label: string;
  description: string;
  icon: typeof Mail;
}[] = [
  { value: "email", label: "Email", description: "Send directly to their inbox", icon: Mail },
  { value: "link", label: "Share link", description: "Copy a redeemable link", icon: Link2 },
  { value: "qr", label: "QR code", description: "Scan to redeem in person", icon: QrCode },
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function GiftPurchaseToggle({ onChange }: GiftPurchaseToggleProps) {
  const [isGift, setIsGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [handoffMethod, setHandoffMethod] = useState<GiftDetails["handoffMethod"]>("email");
  const [emailTouched, setEmailTouched] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const nameFieldId = useId();
  const emailFieldId = useId();
  const messageFieldId = useId();
  const panelId = useId();

  const emailError =
    emailTouched && recipientEmail.length > 0 && !isValidEmail(recipientEmail)
      ? "Enter a valid email address."
      : emailTouched && recipientEmail.length === 0
      ? "Recipient email is required for gifting."
      : null;

  const charsRemaining = MESSAGE_LIMIT - message.length;

  const emitChange = (next: Partial<GiftDetails>) => {
    onChange?.({
      isGift,
      recipientName,
      recipientEmail,
      message,
      handoffMethod,
      ...next,
    });
  };

  const handleToggle = () => {
    const next = !isGift;
    setIsGift(next);
    emitChange({ isGift: next });
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => {
      const combined = prev + emoji;
      const clipped = combined.slice(0, MESSAGE_LIMIT);
      emitChange({ message: clipped });
      return clipped;
    });
    setShowEmojiPicker(false);
  };

  const previewName = recipientName.trim() || "Your recipient";
  const previewEmail = recipientEmail.trim() || "recipient@example.com";

  return (
    <section
      className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 space-y-4"
      aria-labelledby="gift-toggle-title"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400 border border-cyan-400/20">
            <Gift className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <h3 id="gift-toggle-title" className="text-sm font-bold text-white">
              Purchase as a gift
            </h3>
            <p className="helper-text helper-text--muted mt-0.5">
              Buy this time-token for someone else and hand it off with a personal note.
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isGift}
          aria-controls={panelId}
          aria-label="Purchase as a gift"
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
            isGift ? "bg-cyan-400 border-cyan-300" : "bg-white/10 border-white/15"
          }`}
        >
          <span
            className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isGift ? "translate-x-[22px]" : "translate-x-[3px]"
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      {isGift && (
        <div id={panelId} className="space-y-5 border-t border-white/8 pt-4">
          {/* Recipient fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor={nameFieldId} className="text-xs font-semibold text-slate-300">
                Recipient name
              </label>
              <input
                id={nameFieldId}
                type="text"
                value={recipientName}
                onChange={(e) => {
                  setRecipientName(e.target.value);
                  emitChange({ recipientName: e.target.value });
                }}
                placeholder="e.g. Amara Okafor"
                autoComplete="name"
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor={emailFieldId} className="text-xs font-semibold text-slate-300">
                Recipient email
              </label>
              <input
                id={emailFieldId}
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  emitChange({ recipientEmail: e.target.value });
                }}
                onBlur={() => setEmailTouched(true)}
                placeholder="recipient@example.com"
                autoComplete="email"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? `${emailFieldId}-error` : undefined}
                className={`w-full rounded-xl border bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 ${
                  emailError
                    ? "border-rose-400/40 focus-visible:ring-rose-300"
                    : "border-white/10 focus-visible:ring-cyan-300"
                }`}
              />
              {emailError && (
                <p id={`${emailFieldId}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-rose-300">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {emailError}
                </p>
              )}
            </div>
          </div>

          {/* Personalized message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={messageFieldId} className="text-xs font-semibold text-slate-300">
                Personalized message
              </label>
              <span
                className={`text-[11px] tabular-nums ${
                  charsRemaining < 0 ? "text-rose-300" : charsRemaining < 20 ? "text-amber-300" : "text-slate-500"
                }`}
              >
                {charsRemaining} characters left
              </span>
            </div>
            <div className="relative">
              <textarea
                id={messageFieldId}
                value={message}
                onChange={(e) => {
                  const next = e.target.value.slice(0, MESSAGE_LIMIT);
                  setMessage(next);
                  emitChange({ message: next });
                }}
                rows={3}
                maxLength={MESSAGE_LIMIT}
                placeholder="Enjoy this time with me — happy booking!"
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 pb-9 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              />
              <div className="absolute bottom-2 left-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  aria-expanded={showEmojiPicker}
                  aria-haspopup="true"
                  aria-label="Insert emoji"
                  className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <Smile className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {showEmojiPicker && (
                <div
                  role="menu"
                  aria-label="Emoji picker"
                  className="absolute bottom-10 left-2 z-10 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-xl max-w-[180px]"
                >
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      role="menuitem"
                      onClick={() => insertEmoji(emoji)}
                      aria-label={`Insert ${emoji}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-base hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Handoff method */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-slate-300 mb-1.5">Handoff method</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {HANDOFF_OPTIONS.map(({ value, label, description, icon: Icon }) => {
                const active = handoffMethod === value;
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-2.5 text-left transition-colors focus-within:ring-2 focus-within:ring-cyan-300 ${
                      active
                        ? "border-cyan-400/40 bg-cyan-400/10"
                        : "border-white/10 bg-slate-900/60 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gift-handoff-method"
                      value={value}
                      checked={active}
                      onChange={() => {
                        setHandoffMethod(value);
                        emitChange({ handoffMethod: value });
                      }}
                      className="sr-only"
                    />
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <Icon className={`h-3.5 w-3.5 ${active ? "text-cyan-300" : "text-slate-400"}`} aria-hidden="true" />
                      {label}
                      {active && <Check className="h-3 w-3 text-cyan-300 ml-auto" aria-hidden="true" />}
                    </span>
                    <span className="text-[11px] text-slate-400 leading-snug">{description}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Recipient preview card */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Preview</p>
            <div className="rounded-xl border border-white/8 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Gift className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
                <span>
                  To: <span className="font-medium text-slate-200">{previewName}</span> ·{" "}
                  <span className="font-mono">{previewEmail}</span>
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed break-words">
                {message.trim() ? message : "Your personalized message will appear here."}
              </p>
              <p className="text-[11px] text-slate-500">
                Delivered via {HANDOFF_OPTIONS.find((o) => o.value === handoffMethod)?.label.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
