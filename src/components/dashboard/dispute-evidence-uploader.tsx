import React, { useState, useRef, useCallback, useId } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";

export type ScanStatus = "pending" | "scanning" | "clean" | "threat_detected" | "failed";
export type UploadStatus = "idle" | "uploading" | "completed" | "error";

export interface DisputeFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  uploadStatus: UploadStatus;
  scanStatus: ScanStatus;
  errorMessage?: string;
}

export interface DisputeEvidenceUploaderProps {
  maxFileSizeMB?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onFilesChange?: (files: DisputeFile[]) => void;
  isOffline?: boolean;
}

const DEFAULT_ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const DEFAULT_ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".csv", ".docx"];

export function DisputeEvidenceUploader({
  maxFileSizeMB = 10,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxFiles = 5,
  onFilesChange,
  isOffline = false,
}: DisputeEvidenceUploaderProps) {
  const [files, setFiles] = useState<DisputeFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploaderId = useId();

  const notifyChange = (updatedFiles: DisputeFile[]) => {
    setFiles(updatedFiles);
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      const maxBytes = maxFileSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        return `File size exceeds maximum allowed limit of ${maxFileSizeMB}MB.`;
      }

      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();

      const isTypeAllowed = allowedTypes.some(
        (type) => type.toLowerCase() === fileType || (fileType && fileType.includes(type.toLowerCase()))
      );
      const isExtensionAllowed = DEFAULT_ALLOWED_EXTENSIONS.some((ext) =>
        fileName.endsWith(ext)
      );

      if (!isTypeAllowed && !isExtensionAllowed) {
        return `Unsupported file type. Accepted formats: PDF, PNG, JPG, CSV, DOCX.`;
      }

      return null;
    },
    [maxFileSizeMB, allowedTypes]
  );

  const processFile = useCallback(
    (file: File) => {
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const validationError = validateFile(file);

      if (validationError) {
        const invalidFile: DisputeFile = {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.type || "unknown",
          progress: 0,
          uploadStatus: "error",
          scanStatus: "failed",
          errorMessage: validationError,
        };
        return invalidFile;
      }

      if (isOffline) {
        const offlineFile: DisputeFile = {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          uploadStatus: "error",
          scanStatus: "failed",
          errorMessage: "Network offline. Upload paused.",
        };
        return offlineFile;
      }

      const newFile: DisputeFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        uploadStatus: "uploading",
        scanStatus: "pending",
      };

      return newFile;
    },
    [isOffline, validateFile]
  );

  const simulateProgressAndScan = (fileId: string) => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 50;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setFiles((prev) => {
          const updated = prev.map((f) => {
            if (f.id === fileId) {
              return {
                ...f,
                progress: 100,
                uploadStatus: "completed" as UploadStatus,
                scanStatus: "scanning" as ScanStatus,
              };
            }
            return f;
          });
          onFilesChange?.(updated);
          return updated;
        });

        setTimeout(() => {
          setFiles((prev) => {
            const updated = prev.map((f) => {
              if (f.id === fileId) {
                const isThreat =
                  f.name.toLowerCase().includes("virus") ||
                  f.name.toLowerCase().includes("infected");
                return {
                  ...f,
                  scanStatus: (isThreat ? "threat_detected" : "clean") as ScanStatus,
                };
              }
              return f;
            });
            onFilesChange?.(updated);
            return updated;
          });
        }, 50);
      } else {
        setFiles((prev) => {
          const updated = prev.map((f) => {
            if (f.id === fileId) {
              return { ...f, progress: currentProgress };
            }
            return f;
          });
          onFilesChange?.(updated);
          return updated;
        });
      }
    }, 50);
  };

  const handleFiles = (incomingFiles: FileList | File[]) => {
    setGeneralError(null);
    const fileList = Array.from(incomingFiles);

    if (files.length + fileList.length > maxFiles) {
      setGeneralError(`Maximum limit of ${maxFiles} files exceeded.`);
      return;
    }

    const processedFiles: DisputeFile[] = [];
    fileList.forEach((file) => {
      const processed = processFile(file);
      if (processed) {
        processedFiles.push(processed);
      }
    });

    if (processedFiles.length > 0) {
      const newFilesState = [...files, ...processedFiles];
      notifyChange(newFilesState);

      processedFiles.forEach((f) => {
        if (f.uploadStatus === "uploading") {
          simulateProgressAndScan(f.id);
        }
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRetry = (id: string) => {
    if (isOffline) {
      setGeneralError("Cannot retry while offline. Check your network connection.");
      return;
    }
    setFiles((prev) => {
      const updated = prev.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            progress: 0,
            uploadStatus: "uploading" as UploadStatus,
            scanStatus: "pending" as ScanStatus,
            errorMessage: undefined,
          };
        }
        return f;
      });
      onFilesChange?.(updated);
      return updated;
    });
    simulateProgressAndScan(id);
  };

  const handleRemove = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    notifyChange(updated);
    if (generalError) setGeneralError(null);
  };

  const renderVirusScanPill = (scanStatus: ScanStatus) => {
    switch (scanStatus) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            <span>Scan Pending</span>
          </span>
        );
      case "scanning":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-300">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
            <span>Scanning...</span>
          </span>
        );
      case "clean":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Scan Passed</span>
          </span>
        );
      case "threat_detected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-300">
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            <span>Threat Detected</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span>Scan Failed</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-4 text-slate-100 rtl:text-right">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          if (e.target !== fileInputRef.current) {
            fileInputRef.current?.click();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Upload evidence files. Drag and drop files here or click to browse."
        aria-describedby={`${uploaderId}-hint`}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
          isDragging
            ? "border-cyan-400 bg-cyan-950/20 scale-[0.99]"
            : "border-slate-700 hover:border-slate-500 bg-slate-900/40"
        }`}
      >
        <input
          ref={fileInputRef}
          id={uploaderId}
          type="file"
          multiple
          accept={DEFAULT_ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
          className="sr-only"
          tabIndex={-1}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-cyan-400 mb-3">
          <Upload className="h-6 w-6" />
        </div>
        <p className="text-base font-semibold text-slate-200 text-center">
          <span className="text-cyan-400 hover:underline">Click to upload</span> or drag and drop
        </p>
        <p id={`${uploaderId}-hint`} className="mt-1 text-xs text-slate-400 text-center">
          PDF, PNG, JPG, CSV, DOCX (Max {maxFileSizeMB}MB per file, up to {maxFiles} files)
        </p>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-sm text-rose-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{generalError}</span>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3" role="region" aria-label="Uploaded files list">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Attached Evidence ({files.length}/{maxFiles})
          </h4>
          <ul className="space-y-2.5">
            {files.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-3.5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
                      <FileText className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">{item.name}</p>
                      <p className="text-xs text-slate-400">{formatFileSize(item.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {renderVirusScanPill(item.scanStatus)}
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {item.uploadStatus === "uploading" && (
                  <div className="space-y-1 mt-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Uploading...</span>
                      <span>{item.progress}%</span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"
                      role="progressbar"
                      aria-valuenow={item.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uploading ${item.name}`}
                    >
                      <div
                        className="h-full bg-cyan-400 transition-all duration-200"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error & Retry State */}
                {(item.uploadStatus === "error" || item.scanStatus === "threat_detected") && (
                  <div className="flex items-center justify-between gap-2 rounded bg-rose-950/20 p-2 text-xs text-rose-300 border border-rose-900/40 mt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                      <span className="truncate">
                        {item.errorMessage ||
                          (item.scanStatus === "threat_detected"
                            ? "Security threat detected in file."
                            : "Upload failed.")}
                      </span>
                    </div>
                    {item.uploadStatus === "error" && (
                      <button
                        type="button"
                        onClick={() => handleRetry(item.id)}
                        className="inline-flex items-center gap-1 shrink-0 rounded bg-rose-900/40 px-2 py-1 font-medium text-rose-200 hover:bg-rose-800/50 focus:outline-none focus:ring-2 focus:ring-rose-400"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
