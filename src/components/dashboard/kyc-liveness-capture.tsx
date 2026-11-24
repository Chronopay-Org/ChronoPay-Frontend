import React, { useState, useEffect, useRef } from 'react';

export type LivenessPrompt = "blink" | "turn-left" | "turn-right" | "smile";

interface KycLivenessCaptureProps {
  onCaptureComplete: (success: boolean) => void | Promise<void>;
}

export function KycLivenessCapture({ onCaptureComplete }: KycLivenessCaptureProps) {
  const [assistedMode, setAssistedMode] = useState(false);
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [captureStatus, setCaptureStatus] = useState<"idle" | "capturing" | "success" | "failed">("idle");
  const [timeLeft, setTimeLeft] = useState(10);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onCaptureCompleteRef = useRef(onCaptureComplete);

  useEffect(() => {
    onCaptureCompleteRef.current = onCaptureComplete;
  }, [onCaptureComplete]);

  const prompts: { type: LivenessPrompt; text: string; icon: string }[] = [
    { type: "blink", text: "Please blink your eyes naturally.", icon: "👁" },
    { type: "turn-left", text: "Turn your head slowly to the left.", icon: "⬅️" },
    { type: "smile", text: "Give us a big smile!", icon: "😊" },
  ];

  const currentPrompt = prompts[currentPromptIndex];
  const hasTimedOut = captureStatus === "capturing" && timeLeft === 0;

  const stopCamera = () => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (captureStatus === "capturing" && !assistedMode && !textOnlyMode) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [captureStatus, assistedMode, textOnlyMode]);

  useEffect(() => {
    if (hasTimedOut) {
      stopCamera();
      void Promise.resolve()
        .then(() => onCaptureCompleteRef.current(false))
        .catch((error: unknown) => {
        setCaptureError(
          error instanceof Error ? error.message : "Verification could not be updated. Please try again.",
        );
      });
    }
  }, [hasTimedOut]);

  const startCapture = async () => {
    setCaptureStatus("capturing");
    setTimeLeft(10);
    setCurrentPromptIndex(0);
    setCameraError(null);
    setCaptureError(null);

    if (!textOnlyMode) {
      try {
        // Stop any previous stream before acquiring a new one.
        stopCamera();
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setCameraError(
          err instanceof Error && err.name === "NotAllowedError"
            ? "Camera permission was denied. You can continue in text-only mode or retry camera access."
            : "Camera is unavailable. You can continue in text-only mode or retry camera access.",
        );
        setTextOnlyMode(true);
      }
    }
  };

  const handleNextPrompt = async () => {
    if (currentPromptIndex < prompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
      setTimeLeft(10);
    } else {
      stopCamera();
      try {
        await onCaptureCompleteRef.current(true);
        setCaptureStatus("success");
      } catch (error) {
        setCaptureError(
          error instanceof Error ? error.message : "Verification could not be updated. Please try again.",
        );
        setCaptureStatus("failed");
      }
    }
  };

  const handleRetry = () => {
    stopCamera();
    setCaptureStatus("idle");
    setTimeLeft(10);
    setCurrentPromptIndex(0);
    setCaptureError(null);
  };

  const retryCamera = () => {
    setTextOnlyMode(false);
    void startCapture();
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl max-w-md mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Liveness Verification</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setAssistedMode(!assistedMode)}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${assistedMode ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-transparent text-slate-400 border-slate-600 hover:text-slate-300'}`}
            aria-pressed={assistedMode}
          >
            Assisted Mode
          </button>
          <button
            onClick={() => {
              const next = !textOnlyMode;
              setTextOnlyMode(next);
              if (next) stopCamera();
            }}
            className={`text-sm px-3 py-1 rounded-full border transition-colors ${textOnlyMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-transparent text-slate-400 border-slate-600 hover:text-slate-300'}`}
            aria-pressed={textOnlyMode}
          >
            Text Only
          </button>
        </div>
      </div>

      {captureStatus === "idle" && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📸</div>
          <p className="text-slate-300 mb-6 text-base">
            We need to verify you&apos;re a real person. We&apos;ll ask you to perform a few simple actions.
          </p>
          <button
            onClick={startCapture}
            className={`w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-cyan-400 focus:outline-none ${assistedMode ? 'py-4 text-lg' : 'py-2.5 text-sm'}`}
            aria-label="Start liveness verification"
          >
            Start Verification
          </button>
        </div>
      )}

      {captureStatus === "capturing" && !hasTimedOut && (
        <div className="flex flex-col items-center">
          {cameraError && (
            <div className="mb-4 w-full rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200" role="alert">
              <p>{cameraError}</p>
              <button
                type="button"
                onClick={retryCamera}
                className="mt-2 font-semibold underline underline-offset-2"
              >
                Retry camera access
              </button>
            </div>
          )}
          {!textOnlyMode ? (
            <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden mb-6 border-2 border-dashed border-slate-600">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                aria-label="Camera feed for liveness capture"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 start-0 end-0 text-center">
                <p className="text-white font-medium text-lg px-4 drop-shadow-md">
                  <span className="text-2xl me-2" aria-hidden="true">{currentPrompt.icon}</span>
                  {currentPrompt.text}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full bg-slate-900 rounded-lg p-8 mb-6 border-2 border-slate-700 flex flex-col items-center text-center">
               <span className="text-6xl mb-6" aria-hidden="true">{currentPrompt.icon}</span>
               <p className="text-white font-medium text-xl mb-4" role="status" aria-live="polite">
                 {currentPrompt.text}
               </p>
               <p className="text-slate-400 text-sm">
                 Please perform this action and click next when complete.
               </p>
            </div>
          )}

          <div className="w-full flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {!assistedMode && !textOnlyMode && (
                <div className={`text-sm font-medium ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} aria-live="polite">
                  Time left: {timeLeft}s
                </div>
              )}
            </div>
            
            <button
              onClick={handleNextPrompt}
              className={`bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-emerald-400 focus:outline-none ${assistedMode ? 'px-8 py-4 text-lg' : 'px-6 py-2.5 text-sm'}`}
              aria-label="Action completed, go to next prompt"
            >
              {currentPromptIndex === prompts.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
          
          <div className="w-full mt-6 bg-slate-700 h-1.5 rounded-full overflow-hidden" aria-label="Progress">
            <div 
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{ width: `${((currentPromptIndex) / prompts.length) * 100}%`}}
            />
          </div>
        </div>
      )}

      {captureStatus === "success" && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4 text-emerald-400">✅</div>
          <h3 className="text-xl font-bold text-white mb-2">Verification Complete</h3>
          <p className="text-slate-300">Thank you for confirming your identity.</p>
        </div>
      )}

      {(captureStatus === "failed" || hasTimedOut) && (
        <div className="text-center py-8">
          <div className="text-5xl mb-4 text-red-400">❌</div>
          <h3 className="text-xl font-bold text-white mb-2">Verification Failed</h3>
          <p className="text-slate-300 mb-6">
            {captureError ?? "Time ran out before the action was completed. Please try again."}
          </p>
          <button
            onClick={handleRetry}
            className={`w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-slate-400 focus:outline-none ${assistedMode ? 'py-4 text-lg' : 'py-2.5 text-sm'}`}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
