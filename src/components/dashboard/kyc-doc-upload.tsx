"use client";

import React, { useState, useRef, useId, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RotateCcw,
  Check,
  AlertTriangle,
  Maximize2,
  Sun,
  CornerDownRight,
  Upload,
  HelpCircle,
  X,
} from "lucide-react";

export type RetakeReason =
  | "blurry"
  | "glare"
  | "cropped"
  | "dark"
  | "angle"
  | "other";

interface KycDocUploadProps {
  onCaptureComplete: (success: boolean, imageData?: string) => void;
  documentLabel?: string;
}

interface GuidanceHint {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}

const GUIDANCE_HINTS: GuidanceHint[] = [
  {
    id: "fit-to-frame",
    icon: <Maximize2 className="h-4 w-4" aria-hidden="true" />,
    label: "Fit to frame",
    description: "Position the document so all edges are visible within the guide.",
  },
  {
    id: "avoid-glare",
    icon: <Sun className="h-4 w-4" aria-hidden="true" />,
    label: "Avoid glare",
    description: "Tilt the document away from direct light to reduce reflections.",
  },
  {
    id: "corners-visible",
    icon: <CornerDownRight className="h-4 w-4" aria-hidden="true" />,
    label: "All corners visible",
    description: "Ensure all four corners of the document are in view.",
  },
];

const RETAKE_REASONS: { value: RetakeReason; label: string }[] = [
  { value: "blurry", label: "Image is blurry" },
  { value: "glare", label: "Glare or reflection" },
  { value: "cropped", label: "Document is cropped" },
  { value: "dark", label: "Too dark" },
  { value: "angle", label: "Wrong angle" },
  { value: "other", label: "Other reason" },
];

export function KycDocUpload({
  onCaptureComplete,
  documentLabel = "document",
}: KycDocUploadProps) {
  const [step, setStep] = useState<"intro" | "capture" | "preview" | "retake" | "complete">("intro");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [retakeReason, setRetakeReason] = useState<RetakeReason | null>(null);
  const [retakeOtherText, setRetakeOtherText] = useState("");
  const [glareDetected, setGlareDetected] = useState(false);
  const [cornersVisible, setCornersVisible] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const headingId = useId();
  const descriptionId = useId();
  const feedbackId = useId();
  const retakeHeadingId = useId();

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(
        "Camera access was denied or is unavailable. Please grant camera permissions or use text-only mode."
      );
      setTextOnlyMode(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(dataUrl);
    stopCamera();
    setStep("preview");
  }, [stopCamera]);

  const handleStart = async () => {
    setStep("capture");
    if (!textOnlyMode) {
      await startCamera();
    }
  };

  const handleRetake = () => {
    setRetakeReason(null);
    setRetakeOtherText("");
    setCapturedImage(null);
    setStep("retake");
  };

  const handleRetakeConfirm = async () => {
    setStep("capture");
    setCameraError(null);
    if (!textOnlyMode) {
      await startCamera();
    }
  };

  const handleRetakeSkip = () => {
    setStep("capture");
    setCameraError(null);
    if (!textOnlyMode) {
      startCamera();
    }
  };

  const handleConfirmImage = () => {
    setStep("complete");
    onCaptureComplete(true, capturedImage ?? undefined);
  };

  const handleUseTextOnly = () => {
    stopCamera();
    setTextOnlyMode(true);
  };

  const handleReset = () => {
    stopCamera();
    setStep("intro");
    setCameraError(null);
    setCapturedImage(null);
    setRetakeReason(null);
    setRetakeOtherText("");
    setTextOnlyMode(false);
    setGlareDetected(false);
    setCornersVisible(true);
  };

  const docLabel = documentLabel;

  return (
    <div
      className="bg-slate-800 p-4 sm:p-6 rounded-lg border border-slate-700 shadow-xl max-w-lg mx-auto w-full"
      role="region"
      aria-labelledby={headingId}
      aria-describedby={step !== "complete" ? descriptionId : undefined}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 id={headingId} className="text-lg font-bold text-white">
          Upload {docLabel}
        </h2>
        <div className="flex items-center gap-2">
          {step !== "intro" && step !== "complete" && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-slate-400 hover:text-slate-300 hover:border-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Restart document upload"
            >
              <X className="h-3.5 w-3.5 inline-block align-middle" aria-hidden="true" />
              <span className="ml-1 align-middle">Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Guidance hints (visible during capture/preview) ─────────────── */}
      {(step === "capture" || step === "preview" || step === "retake") && (
        <ul
          className="flex flex-wrap gap-2 mb-4"
          aria-label="Document capture guidance"
        >
          {GUIDANCE_HINTS.map((hint) => (
            <li
              key={hint.id}
              className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/50"
              title={hint.description}
            >
              {hint.icon}
              <span>{hint.label}</span>
            </li>
          ))}
        </ul>
      )}

      {/* ── Screen reader guidance text ─────────────────────────────────── */}
      <p id={descriptionId} className="sr-only">
        {step === "intro" &&
          `Use your camera to capture a clear image of your ${docLabel}. Follow the on-screen guidance for best results. You can switch to text-only mode if your camera is unavailable.`}
        {step === "capture" &&
          `Position your ${docLabel} within the visible frame. Ensure all corners are visible and avoid glare from direct light. Press the capture button when ready.`}
        {step === "preview" &&
          `Review the captured image of your ${docLabel}. If it looks good, confirm to proceed. If not, you can retake the photo and tell us what went wrong.`}
        {step === "retake" &&
          `Tell us why you need to retake the ${docLabel} photo so we can provide better guidance.`}
      </p>

      {/* ── Screen reader live region for feedback ──────────────────────── */}
      <div
        id={feedbackId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {step === "capture" && "Camera is active. Position your document in the frame."}
        {step === "preview" && "Image captured. Review and confirm or retake."}
        {step === "complete" && `${docLabel} uploaded successfully.`}
        {cameraError && cameraError}
      </div>

      {/* ── Text-only mode banner ───────────────────────────────────────── */}
      {textOnlyMode && step !== "complete" && (
        <div
          className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-sm text-purple-200"
          role="alert"
        >
          <HelpCircle className="h-4 w-4 inline-block align-middle mr-1.5" aria-hidden="true" />
          <span className="align-middle">
            Text-only mode active. You can upload a photo file instead of using the camera.
          </span>
        </div>
      )}

      {/* ── Steps ────────────────────────────────────────────────────────── */}

      {/* INTRO */}
      {step === "intro" && (
        <div className="text-center py-6">
          <div className="text-4xl mb-4 text-cyan-400" aria-hidden="true">
            <Upload className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-slate-300 mb-6 text-sm sm:text-base">
            We need a clear photo of your {docLabel}. Make sure the entire
            document is visible, well-lit, and free of glare.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              Open Camera
            </button>
            <button
              type="button"
              onClick={() => {
                setTextOnlyMode(true);
                handleStart();
              }}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload a File
            </button>
          </div>
        </div>
      )}

      {/* CAPTURE */}
      {step === "capture" && (
        <div className="flex flex-col items-center">
          {!textOnlyMode ? (
            <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden mb-4 border-2 border-dashed border-slate-600">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                aria-label={`Camera feed for ${docLabel} capture`}
              />

              {/* Guidance overlay: document frame guide */}
              <div
                className="absolute inset-0 pointer-events-none"
                aria-hidden="true"
              >
                {/* Frame guide rectangle */}
                <div
                  className={[
                    "absolute inset-[15%] border-2 rounded-sm",
                    glareDetected
                      ? "border-amber-400"
                      : cornersVisible
                        ? "border-cyan-400"
                        : "border-amber-400",
                  ].join(" ")}
                >
                  {/* Corner markers */}
                  <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-300" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-300" />
                  <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-300" />
                  <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-300" />
                </div>

                {/* Glare warning overlay */}
                {glareDetected && (
                  <div className="absolute top-3 left-3 right-3 bg-amber-500/20 backdrop-blur-sm rounded px-3 py-1.5 flex items-center gap-2 text-amber-300 text-xs border border-amber-500/30">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Glare detected — adjust lighting</span>
                  </div>
                )}

                {/* Corner warning */}
                {!cornersVisible && (
                  <div className="absolute bottom-3 left-3 right-3 bg-amber-500/20 backdrop-blur-sm rounded px-3 py-1.5 flex items-center gap-2 text-amber-300 text-xs border border-amber-500/30">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Some corners are not visible — adjust position</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full bg-slate-900 rounded-lg p-8 mb-4 border-2 border-dashed border-slate-700 flex flex-col items-center text-center">
              <Upload className="h-12 w-12 text-slate-500 mb-4" aria-hidden="true" />
              <p className="text-slate-300 text-sm mb-4">
                Select a photo of your {docLabel} from your device.
              </p>
              <label className="inline-flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg cursor-pointer transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 text-sm">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Choose File
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label={`Select ${docLabel} image file`}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        setCapturedImage(dataUrl);
                        setStep("preview");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          )}

          {/* Capture controls */}
          <div className="w-full flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              {/* Simulated glare toggle (for demo/testing) */}
              {!textOnlyMode && (
                <button
                  type="button"
                  onClick={() => setGlareDetected((g) => !g)}
                  className={[
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    glareDetected
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-transparent text-slate-400 border-slate-600 hover:text-slate-300",
                  ].join(" ")}
                  aria-pressed={glareDetected}
                  aria-label="Toggle glare detection simulation"
                >
                  <Sun className="h-3 w-3 inline-block align-middle mr-1" aria-hidden="true" />
                  Glare
                </button>
              )}
              {!textOnlyMode && (
                <button
                  type="button"
                  onClick={() => setCornersVisible((c) => !c)}
                  className={[
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    !cornersVisible
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-transparent text-slate-400 border-slate-600 hover:text-slate-300",
                  ].join(" ")}
                  aria-pressed={!cornersVisible}
                  aria-label="Toggle corner visibility simulation"
                >
                  <CornerDownRight className="h-3 w-3 inline-block align-middle mr-1" aria-hidden="true" />
                  Corners
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!textOnlyMode && (
                <button
                  type="button"
                  onClick={handleUseTextOnly}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-600 text-slate-400 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  aria-label="Switch to text-only file upload mode"
                >
                  Text Only
                </button>
              )}
              <button
                type="button"
                onClick={captureFrame}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm"
                aria-label={`Capture ${docLabel} photo`}
              >
                <Camera className="h-4 w-4" aria-hidden="true" />
                Capture
              </button>
            </div>
          </div>

          {/* Camera error banner */}
          {cameraError && (
            <div
              className="mt-4 w-full p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-200"
              role="alert"
            >
              <CameraOff className="h-4 w-4 inline-block align-middle mr-1.5" aria-hidden="true" />
              <span className="align-middle">{cameraError}</span>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW */}
      {step === "preview" && capturedImage && (
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-lg overflow-hidden mb-4 border border-slate-600">
            <img
              src={capturedImage}
              alt={`Preview of captured ${docLabel}`}
              className="w-full h-full object-contain"
            />
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleConfirmImage}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Confirm {docLabel}
            </button>
            <button
              type="button"
              onClick={handleRetake}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retake
            </button>
          </div>
        </div>
      )}

      {/* RETAKE REASON */}
      {step === "retake" && (
        <div className="py-2">
          <h3 id={retakeHeadingId} className="text-sm font-semibold text-white mb-3">
            What went wrong with the photo?
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Select a reason so we can show better guidance next time.
          </p>

          <div
            className="flex flex-col gap-2 mb-4"
            role="radiogroup"
            aria-labelledby={retakeHeadingId}
          >
            {RETAKE_REASONS.map((reason) => (
              <label
                key={reason.value}
                className={[
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm",
                  retakeReason === reason.value
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-200"
                    : "bg-slate-700/40 border-slate-600/50 text-slate-300 hover:bg-slate-700/60",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="retake-reason"
                  value={reason.value}
                  checked={retakeReason === reason.value}
                  onChange={() => setRetakeReason(reason.value)}
                  className="sr-only"
                />
                <span
                  className={[
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                    retakeReason === reason.value
                      ? "border-cyan-400"
                      : "border-slate-500",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {retakeReason === reason.value && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  )}
                </span>
                {reason.label}
              </label>
            ))}
          </div>

          {retakeReason === "other" && (
            <div className="mb-4">
              <label htmlFor="retake-other" className="sr-only">
                Describe the issue
              </label>
              <textarea
                id="retake-other"
                value={retakeOtherText}
                onChange={(e) => setRetakeOtherText(e.target.value)}
                placeholder="Describe what went wrong..."
                rows={2}
                className="w-full p-2.5 text-sm rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRetakeConfirm}
              disabled={!retakeReason}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Retake
            </button>
            <button
              type="button"
              onClick={handleRetakeSkip}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm"
            >
              Skip & Retake
            </button>
          </div>
        </div>
      )}

      {/* COMPLETE */}
      {step === "complete" && (
        <div className="text-center py-6">
          <div className="text-5xl mb-4 text-emerald-400" aria-hidden="true">
            <Check className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {docLabel} Captured
          </h3>
          <p className="text-slate-300 text-sm mb-6">
            Your {docLabel} has been uploaded successfully. We will review it shortly.
          </p>
          {capturedImage && (
            <div className="w-32 h-24 mx-auto rounded-lg overflow-hidden border border-slate-600 mb-4">
              <img
                src={capturedImage}
                alt={`Final captured ${docLabel}`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-sm"
            aria-label={`Upload another ${docLabel}`}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload Another
          </button>
        </div>
      )}

      {/* ── Hidden canvas for frame capture ─────────────────────────────── */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </div>
  );
}