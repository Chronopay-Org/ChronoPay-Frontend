"use client";

/**
 * RedemptionScanner — supplier-side scanner UI for verifying a buyer's
 * redemption QR code at slot check-in. Shows a live camera viewport with a
 * target box, a manual code entry fallback, and a distinct visual + textual
 * state for valid / expired / already-redeemed results.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Camera permission state is announced via aria-live; denial falls back
 *     to visible instructional text plus the always-available manual form.
 *   - Result state is never conveyed by colour alone — each state pairs a
 *     distinct icon, heading, and body copy.
 *   - The manual code field is a labelled <input> reachable without a
 *     pointer; submitting announces the result via aria-live="polite".
 *   - Dark-mode palette matches the dashboard; RTL via dir="auto".
 */

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  RotateCcw,
  ScanLine,
  XCircle,
} from "lucide-react";

export type RedemptionResult = "valid" | "expired" | "already_redeemed";

type CameraState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

const RESULT_CONFIG: Record<
  RedemptionResult,
  { label: string; description: string; classes: string; Icon: typeof CheckCircle2 }
> = {
  valid: {
    label: "Valid — redeem now",
    description: "This code is valid and hasn't been redeemed yet.",
    classes: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
    Icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    description: "This slot's redemption window has passed.",
    classes: "border-amber-400/40 bg-amber-400/10 text-amber-100",
    Icon: Clock,
  },
  already_redeemed: {
    label: "Already redeemed",
    description: "This code was already used to check in.",
    classes: "border-rose-400/40 bg-rose-400/10 text-rose-100",
    Icon: XCircle,
  },
};

export interface RedemptionScannerProps {
  /**
   * Verify a scanned or manually-entered code. Return the redemption
   * result, or throw/reject to surface a lookup error.
   */
  onVerify: (code: string) => Promise<RedemptionResult> | RedemptionResult;
  className?: string;
}

export function RedemptionScanner({ onVerify, className = "" }: RedemptionScannerProps) {
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<RedemptionResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const baseId = useId();
  const manualInputId = `${baseId}-manual-code`;

  useEffect(() => {
    let cancelled = false;

    async function requestCamera() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setCameraState("unsupported");
        return;
      }
      setCameraState("requesting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraState("granted");
      } catch {
        if (!cancelled) setCameraState("denied");
      }
    }

    requestCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const runVerification = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setIsVerifying(true);
    setLookupError(null);
    try {
      const outcome = await onVerify(trimmed);
      setResult(outcome);
      setAnnouncement(`${RESULT_CONFIG[outcome].label}. ${RESULT_CONFIG[outcome].description}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Couldn't verify this code. Try again.";
      setLookupError(message);
      setAnnouncement(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runVerification(manualCode);
  };

  const reset = () => {
    setResult(null);
    setLookupError(null);
    setManualCode("");
    setAnnouncement("Ready to scan the next code.");
  };

  return (
    <section
      dir="auto"
      className={`glass-panel rounded-[2rem] border border-white/10 bg-slate-950/40 p-6 text-slate-100 sm:p-8 ${className}`}
      aria-label="Redemption scanner"
    >
      <header className="mb-5 space-y-1">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">ChronoPay</p>
        <h2 className="text-xl font-extrabold tracking-tight text-white">Verify redemption</h2>
        <p className="helper-text helper-text--muted">
          Point the camera at the buyer&apos;s QR code, or enter it manually below.
        </p>
      </header>

      {/* Camera viewport */}
      <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/60 sm:mx-0 mx-auto">
        {cameraState === "granted" ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            aria-hidden={true}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
            {cameraState === "denied" || cameraState === "unsupported" ? (
              <CameraOff className="h-8 w-8 text-slate-400" aria-hidden={true} />
            ) : (
              <Camera className="h-8 w-8 animate-pulse text-slate-400" aria-hidden={true} />
            )}
            <p className="text-sm font-medium text-slate-200">
              {cameraState === "requesting" && "Requesting camera access…"}
              {cameraState === "denied" &&
                "Camera access was denied. Enable it in your browser settings, or enter the code manually below."}
              {cameraState === "unsupported" &&
                "Camera scanning isn't available on this device. Enter the code manually below."}
              {cameraState === "idle" && "Preparing camera…"}
            </p>
          </div>
        )}

        {/* Scan target box overlay */}
        {cameraState === "granted" && !result && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-2/3 w-2/3">
              <ScanLine
                className="absolute inset-x-0 top-1/2 h-6 w-6 -translate-y-1/2 self-center justify-self-center text-cyan-300/80 mx-auto motion-safe:animate-pulse"
                aria-hidden={true}
              />
              {(["top-0 left-0 border-t-2 border-l-2", "top-0 right-0 border-t-2 border-r-2", "bottom-0 left-0 border-b-2 border-l-2", "bottom-0 right-0 border-b-2 border-r-2"] as const).map(
                (cornerClasses) => (
                  <span
                    key={cornerClasses}
                    className={`absolute h-8 w-8 rounded-sm border-cyan-300/90 ${cornerClasses}`}
                  />
                ),
              )}
            </div>
          </div>
        )}

        {/* Result overlay */}
        {result && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 border-4 p-4 text-center ${RESULT_CONFIG[result].classes}`}
          >
            {(() => {
              const { Icon, label, description } = RESULT_CONFIG[result];
              return (
                <>
                  <Icon className="h-10 w-10" aria-hidden={true} />
                  <p className="text-base font-bold">{label}</p>
                  <p className="text-xs">{description}</p>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {result && (
        <button
          type="button"
          onClick={reset}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-cyan-300/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden={true} />
          Scan next code
        </button>
      )}

      {/* Manual fallback */}
      <form onSubmit={handleManualSubmit} className="mt-6 border-t border-white/10 pt-5">
        <label htmlFor={manualInputId} className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Manual code entry
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id={manualInputId}
            type="text"
            inputMode="text"
            autoComplete="off"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="e.g. CHRONO-8841-QK"
            className="w-full flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          />
          <button
            type="submit"
            disabled={isVerifying || manualCode.trim().length === 0}
            className="inline-flex items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? "Verifying…" : "Verify"}
          </button>
        </div>
        {lookupError && (
          <p role="alert" className="mt-2 text-xs text-rose-300">
            {lookupError}
          </p>
        )}
      </form>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
