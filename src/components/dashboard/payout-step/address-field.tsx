"use client";

import { useId, type RefObject } from "react";
import { STELLAR_MEMO_MAX_BYTES } from "./validation";

export interface AddressFieldProps {
  address: string;
  onAddressChange: (value: string) => void;
  addressError?: string;
  showAddressError: boolean;
  addressInputRef?: RefObject<HTMLInputElement | null>;
  memo: string;
  onMemoChange: (value: string) => void;
  memoError?: string;
  memoByteLength: number;
  showMemoError: boolean;
  memoInputRef?: RefObject<HTMLInputElement | null>;
  onAddressBlur?: () => void;
  onMemoBlur?: () => void;
}

export function AddressField({
  address,
  onAddressChange,
  addressError,
  showAddressError,
  addressInputRef,
  memo,
  onMemoChange,
  memoError,
  memoByteLength,
  showMemoError,
  memoInputRef,
  onAddressBlur,
  onMemoBlur,
}: AddressFieldProps) {
  const addressId = useId();
  const addressHintId = useId();
  const addressErrorId = useId();
  const memoId = useId();
  const memoHintId = useId();
  const memoErrorId = useId();

  const addressInvalid = showAddressError && Boolean(addressError);
  const memoInvalid = showMemoError && Boolean(memoError);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div>
        <label
          htmlFor={addressId}
          className="block text-sm font-medium text-white"
        >
          Stellar public key
        </label>
        <p id={addressHintId} className="mt-0.5 text-xs text-slate-400">
          56-character Stellar address starting with G (base32: A–Z, 2–7).
        </p>
        <input
          ref={addressInputRef}
          id={addressId}
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          onBlur={onAddressBlur}
          placeholder="GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
          autoComplete="off"
          spellCheck={false}
          aria-required="true"
          aria-invalid={addressInvalid || undefined}
          aria-describedby={
            addressInvalid ? `${addressHintId} ${addressErrorId}` : addressHintId
          }
          className={`mt-2 w-full rounded-xl border bg-slate-900/80 px-3.5 py-2.5 font-mono text-xs text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
            addressInvalid
              ? "border-rose-400/60 focus-visible:ring-rose-300"
              : "border-white/15"
          }`}
        />
        {addressInvalid && (
          <p
            id={addressErrorId}
            role="alert"
            className="mt-1.5 text-xs font-medium text-rose-300"
          >
            {addressError}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={memoId}
            className="block text-sm font-medium text-white"
          >
            Memo <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <span
            className={`text-[11px] tabular-nums ${
              memoByteLength > STELLAR_MEMO_MAX_BYTES
                ? "font-medium text-rose-300"
                : "text-slate-400"
            }`}
          >
            {memoByteLength}/{STELLAR_MEMO_MAX_BYTES} bytes
          </span>
        </div>
        <p id={memoHintId} className="mt-0.5 text-xs text-slate-400">
          Required by some exchanges or custodial wallets. Max {STELLAR_MEMO_MAX_BYTES} UTF-8 bytes.
        </p>
        <input
          ref={memoInputRef}
          id={memoId}
          type="text"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          onBlur={onMemoBlur}
          placeholder="Optional text memo"
          autoComplete="off"
          aria-invalid={memoInvalid || undefined}
          aria-describedby={
            memoInvalid ? `${memoHintId} ${memoErrorId}` : memoHintId
          }
          className={`mt-2 w-full rounded-xl border bg-slate-900/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
            memoInvalid
              ? "border-rose-400/60 focus-visible:ring-rose-300"
              : "border-white/15"
          }`}
        />
        {memoInvalid && (
          <p
            id={memoErrorId}
            role="alert"
            className="mt-1.5 text-xs font-medium text-rose-300"
          >
            {memoError}
          </p>
        )}
      </div>
    </div>
  );
}
