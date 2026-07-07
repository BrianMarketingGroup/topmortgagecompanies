"use client";

import { useRef, useState } from "react";
import { clsx } from "clsx";
import { UploadCloud, X } from "lucide-react";
import type { UploadedFileMeta } from "@/lib/store/checkoutStore";

export default function FileUploadDropzone({
  label,
  value,
  onChange,
}: {
  label: string;
  value: UploadedFileMeta | undefined;
  onChange: (meta: UploadedFileMeta | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    // Mock-only: create a local object URL for preview, nothing is uploaded anywhere.
    const previewUrl = URL.createObjectURL(file);
    onChange({ name: file.name, sizeKb: Math.round(file.size / 1024), previewUrl });
  }

  return (
    <div>
      <p className="text-sm font-medium text-primary mb-1.5">{label}</p>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: object URL, next/image can't optimize it */}
          <img
            src={value.previewUrl}
            alt={`${label} preview`}
            className="h-12 w-12 rounded-md object-cover border border-border"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-dark truncate">{value.name}</p>
            <p className="text-xs text-muted">{value.sizeKb} KB</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-muted hover:text-danger"
            aria-label={`Remove ${label}`}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={clsx(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50",
          )}
        >
          <UploadCloud size={20} className="text-muted" />
          <span className="text-sm text-muted">Drag & drop, or click to select a file</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
