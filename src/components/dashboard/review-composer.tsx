"use client";

import { useState, useRef } from "react";
import { Star, Upload, X, Image as ImageIcon, Save, Send } from "lucide-react";
import clsx from "clsx";

export interface ReviewCriterion {
  id: string;
  label: string;
  description?: string;
}

export interface ReviewComposerProps {
  criteria: ReviewCriterion[];
  onSubmit?: (data: ReviewSubmissionData) => void;
  onSaveDraft?: (data: ReviewSubmissionData) => void;
  maxPhotos?: number;
  maxCommentLength?: number;
  className?: string;
}

export interface ReviewSubmissionData {
  ratings: Record<string, number>;
  comment: string;
  photos: Array<{ file: File; altText: string }>;
}

const DEFAULT_MAX_PHOTOS = 5;
const DEFAULT_MAX_COMMENT_LENGTH = 500;

export function ReviewComposer({
  criteria,
  onSubmit,
  onSaveDraft,
  maxPhotos = DEFAULT_MAX_PHOTOS,
  maxCommentLength = DEFAULT_MAX_COMMENT_LENGTH,
  className = "",
}: ReviewComposerProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<Array<{ file: File; altText: string; preview: string }>>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRatingChange = (criterionId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [criterionId]: rating }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxCommentLength) {
      setComment(value);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0 && photos.length + files.length <= maxPhotos) {
      const newPhotos = files.map((file) => ({
        file,
        altText: "",
        preview: URL.createObjectURL(file),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0 && photos.length + files.length <= maxPhotos) {
      const newPhotos = files.map((file) => ({
        file,
        altText: "",
        preview: URL.createObjectURL(file),
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].preview);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  };

  const handlePhotoAltTextChange = (index: number, altText: string) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      newPhotos[index] = { ...newPhotos[index], altText };
      return newPhotos;
    });
  };

  const areAllPhotosAltTextFilled = photos.every((photo) => photo.altText.trim() !== "");

  const canSubmit = 
    criteria.every((criterion) => ratings[criterion.id] && ratings[criterion.id] > 0) &&
    comment.trim().length > 0 &&
    areAllPhotosAltTextFilled;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    const submissionData: ReviewSubmissionData = {
      ratings,
      comment,
      photos: photos.map(({ file, altText }) => ({ file, altText })),
    };

    try {
      await onSubmit?.(submissionData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const draftData: ReviewSubmissionData = {
      ratings,
      comment,
      photos: photos.map(({ file, altText }) => ({ file, altText })),
    };
    onSaveDraft?.(draftData);
  };

  return (
    <section
      className={clsx(
        "rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5",
        className
      )}
      aria-label="Review composer"
    >
      <h2 className="mb-6 text-lg font-semibold text-white">
        Write a Review
      </h2>

      {/* Rating Criteria */}
      <div className="mb-6 space-y-4">
        <fieldset className="space-y-4">
          <legend className="text-sm font-medium text-slate-300">
            Rate your experience
          </legend>
          {criteria.map((criterion) => (
            <div key={criterion.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`rating-${criterion.id}`}
                  className="text-sm font-medium text-white"
                >
                  {criterion.label}
                </label>
                <span className="text-xs text-slate-400">
                  {ratings[criterion.id] || 0}/5
                </span>
              </div>
              {criterion.description && (
                <p className="text-xs text-slate-500">{criterion.description}</p>
              )}
              <div
                className="flex gap-1"
                role="group"
                aria-label={`Rate ${criterion.label}`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(criterion.id, star)}
                    className="rounded p-1 transition-colors hover:bg-white/5 focus-ring-cyan"
                    aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                    aria-pressed={ratings[criterion.id] === star}
                  >
                    <Star
                      className={clsx(
                        "h-5 w-5",
                        ratings[criterion.id] >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-600"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </fieldset>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <label
          htmlFor="review-comment"
          className="mb-2 block text-sm font-medium text-white"
        >
          Your Comment
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={handleCommentChange}
          placeholder="Share your experience..."
          rows={4}
          maxLength={maxCommentLength}
          className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-slate-500 focus-ring-cyan focus:border-cyan-500/50"
          aria-describedby="comment-char-count"
        />
        <div
          id="comment-char-count"
          className="mt-1 text-right text-xs text-slate-500"
        >
          {comment.length}/{maxCommentLength}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-white">
          Photos (optional)
        </label>
        
        <div
          className={clsx(
            "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            dragActive
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-white/10 hover:border-white/20",
            photos.length >= maxPhotos && "opacity-50 pointer-events-none"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Drop photos here or click to upload"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />
          <Upload className="mx-auto mb-2 h-8 w-8 text-slate-500" aria-hidden="true" />
          <p className="text-sm text-slate-400">
            Drag and drop photos here, or click to browse
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {photos.length}/{maxPhotos} photos uploaded
          </p>
        </div>

        {/* Photo Previews with Alt Text */}
        {photos.length > 0 && (
          <div className="mt-4 space-y-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="flex gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
              >
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded">
                  <img
                    src={photo.preview}
                    alt={`Preview ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <label
                    htmlFor={`photo-alt-${index}`}
                    className="text-xs font-medium text-slate-300"
                  >
                    Alt text (required)
                  </label>
                  <input
                    id={`photo-alt-${index}`}
                    type="text"
                    value={photo.altText}
                    onChange={(e) => handlePhotoAltTextChange(index, e.target.value)}
                    placeholder="Describe this image for accessibility..."
                    className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus-ring-cyan focus:border-cyan-500/50"
                    aria-required="true"
                    aria-invalid={photo.altText.trim() === ""}
                  />
                  {!photo.altText.trim() && (
                    <p className="text-[10px] text-rose-400">
                      Alt text is required before submitting
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-rose-400 focus-ring-cyan"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        {onSaveDraft && (
          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 focus-ring-cyan sm:order-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save as Draft
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={clsx(
            "flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-6 py-2.5 text-sm font-medium text-white transition-colors focus-ring-cyan sm:order-1",
            canSubmit && !isSubmitting
              ? "hover:bg-cyan-400"
              : "cursor-not-allowed opacity-50"
          )}
          aria-disabled={!canSubmit || isSubmitting}
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </section>
  );
}
