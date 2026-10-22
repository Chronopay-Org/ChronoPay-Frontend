"use client";

import { useId, useState } from "react";
import { AlertCircle } from "lucide-react";
import { DisputeEvidenceUploader, type DisputeFile } from "@/components/dashboard/dispute-evidence-uploader";

export interface DisputeFormData { category: string; reason: string; description: string; evidence: File[]; }
export interface DisputeFilingFormProps { slotId: string; onSubmit: (formData: DisputeFormData) => Promise<void>; isSubmitting: boolean; onCancel: () => void; }

const DISPUTE_CATEGORIES = [
  { value: "quality_mismatch", label: "Quality Mismatch" }, { value: "service_not_delivered", label: "Service Not Delivered" },
  { value: "incorrect_duration", label: "Incorrect Duration" }, { value: "communication_issue", label: "Communication Issue" }, { value: "other", label: "Other" },
];

export function DisputeFilingForm({ slotId: _slotId, onSubmit, isSubmitting, onCancel }: DisputeFilingFormProps) {
  const [category, setCategory] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<DisputeFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formId = useId();
  const categoryId = `${formId}-category`;
  const reasonId = `${formId}-reason`;
  const descriptionId = `${formId}-description`;
  const evidenceErrorId = `${formId}-evidence-error`;
  const evidenceIsReady = evidenceFiles.length === 0 || evidenceFiles.every((file) => file.uploadStatus === "completed" && file.scanStatus === "clean");

  const validate = () => {
    const next: Record<string, string> = {};
    if (!category) next.category = "Please select a dispute category.";
    if (!reason.trim()) next.reason = "Please provide a brief reason.";
    if (!description.trim()) next.description = "Please provide a detailed description.";
    if (evidenceFiles.length > 0 && !evidenceIsReady) next.evidence = "Remove or resolve all evidence files before submitting the dispute.";
    return next;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSubmit({ category, reason, description, evidence: evidenceFiles.map((file) => file.file) });
  };

  const handleEvidenceChange = (files: DisputeFile[]) => {
    setEvidenceFiles(files);
    setErrors((current) => {
      if (!current.evidence || (files.length > 0 && !files.every((file) => file.uploadStatus === "completed" && file.scanStatus === "clean"))) return current;
      const next = { ...current };
      delete next.evidence;
      return next;
    });
  };

  const canSubmit = !isSubmitting && !!category && !!reason.trim() && !!description.trim() && evidenceIsReady;
  const error = (id: string, message?: string) => message && <p id={id} role="alert" className="mt-1 text-xs text-rose-300">{message}</p>;

  return <form onSubmit={handleSubmit} className="space-y-5" noValidate>
    <div>
      <label htmlFor={categoryId} className="block text-sm font-medium text-slate-300 mb-2">Dispute Category</label>
      <select id={categoryId} value={category} onChange={(event) => setCategory(event.target.value)} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? `${categoryId}-error` : undefined} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20" disabled={isSubmitting}>
        <option value="">Select a category</option>{DISPUTE_CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
      </select>{error(`${categoryId}-error`, errors.category)}
    </div>
    <div>
      <label htmlFor={reasonId} className="block text-sm font-medium text-slate-300 mb-2">Brief Reason</label>
      <input id={reasonId} type="text" value={reason} onChange={(event) => setReason(event.target.value)} aria-invalid={Boolean(errors.reason)} aria-describedby={errors.reason ? `${reasonId}-error` : undefined} placeholder="e.g., Service was shorter than expected" className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20" disabled={isSubmitting} maxLength={100} />
      {error(`${reasonId}-error`, errors.reason)}
    </div>
    <div>
      <label htmlFor={descriptionId} className="block text-sm font-medium text-slate-300 mb-2">Detailed Description</label>
      <textarea id={descriptionId} value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? `${descriptionId}-error` : undefined} placeholder="Please provide a detailed description of the issue..." rows={4} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none focus:ring-2 focus:ring-amber-400/20 resize-none" disabled={isSubmitting} maxLength={1000} />
      {error(`${descriptionId}-error`, errors.description)}<p className="text-xs text-slate-500 mt-1 text-right">{description.length}/1000</p>
    </div>
    <div>
      <p className="block text-sm font-medium text-slate-300 mb-2">Evidence (Optional)</p>
      <DisputeEvidenceUploader maxFileSizeMB={10} allowedTypes={["application/pdf", "image/png", "image/jpeg", "image/jpg"]} onFilesChange={handleEvidenceChange} disabled={isSubmitting} ariaLabel="Evidence (Optional)" ariaDescribedBy={errors.evidence ? evidenceErrorId : undefined} />
      {error(evidenceErrorId, errors.evidence)}
    </div>
    <div className="flex items-start gap-2 bg-amber-400/10 border border-amber-400/20 rounded-lg p-3"><AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /><p className="text-xs text-amber-200">Filing a dispute will temporarily pause the escrow release. A mediator will review your case within 24-48 hours.</p></div>
    <div className="flex gap-3 pt-2"><button type="button" onClick={onCancel} className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 transition-colors" disabled={isSubmitting}>Cancel</button><button type="submit" disabled={!canSubmit} className="flex-1 rounded-full px-4 py-2.5 text-sm font-medium bg-amber-400 text-slate-950 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">{isSubmitting ? "Submitting..." : "Submit Dispute"}</button></div>
  </form>;
}
