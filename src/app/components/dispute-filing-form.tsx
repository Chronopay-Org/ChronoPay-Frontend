"use client";

import { useState } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";

export interface DisputeFormData {
  category: string;
  reason: string;
  description: string;
  evidence: File[];
}

export interface DisputeFilingFormProps {
  slotId: string;
  onSubmit: (formData: DisputeFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const DISPUTE_CATEGORIES = [
  { value: "quality_mismatch", label: "Quality Mismatch" },
  { value: "service_not_delivered", label: "Service Not Delivered" },
  { value: "incorrect_duration", label: "Incorrect Duration" },
  { value: "communication_issue", label: "Communication Issue" },
  { value: "other", label: "Other" },
];

export function DisputeFilingForm({
  slotId,
  onSubmit,
  isSubmitting,
  onCancel,
}: DisputeFilingFormProps) {
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidence((prev) => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !reason || !description) {
      return;
    }
    await onSubmit({ category, reason, description, evidence });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Dispute Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          disabled={isSubmitting}
        >
          <option value="">Select a category</option>
          {DISPUTE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Brief Reason
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Service was shorter than expected"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          disabled={isSubmitting}
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Detailed Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please provide a detailed description of the issue..."
          rows={4}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none"
          disabled={isSubmitting}
          maxLength={1000}
        />
        <p className="text-xs text-slate-500 mt-1 text-right">
          {description.length}/1000
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Evidence (Optional)
        </label>
        <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-amber-400/30 transition-colors">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="evidence-upload"
            disabled={isSubmitting}
          />
          <label
            htmlFor="evidence-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-300">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-slate-500 mt-1">
              PDF, PNG, JPG up to 10MB each
            </p>
          </label>
        </div>

        {evidence.length > 0 && (
          <div className="mt-3 space-y-2">
            {evidence.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-300 truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
        <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-200">
          Filing a dispute will temporarily pause the escrow release. A mediator
          will review your case within 24-48 hours.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!category || !reason || !description || isSubmitting}
          className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Dispute"}
        </button>
      </div>
    </form>
  );
}
