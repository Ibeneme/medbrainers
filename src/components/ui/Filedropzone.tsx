///Users/macbook/Downloads/CodesDoc/medbrainers/src/components/ui/Filedropzone.tsx

"use client";

import { useRef, useState } from "react";
import { Upload, Eye, X, FileText } from "lucide-react";

export interface UploadedFile {
  name: string;
  size: string;
  type: string;
  url: string;
  file?: File; // raw file, kept so you can send it to your API later
}

interface FileDropzoneProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  ui: Record<string, any>;
  accent: string;
  maxFiles?: number; // default 10
  maxSizeMB?: number; // default 10
  accept?: string[]; // mime types or "image/*"
  label?: string;
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function FileDropzone({
  files,
  onChange,
  ui,
  accent,
  maxFiles = 10,
  maxSizeMB = 10,
  accept = ["image/*", "application/pdf"],
  label = "Attachments",
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const isFull = files.length >= maxFiles;
  const remaining = maxFiles - files.length;

  const isAccepted = (file: File) =>
    accept.some((a) =>
      a.endsWith("/*") ? file.type.startsWith(a.slice(0, -1)) : file.type === a
    );

  const addFiles = (incoming: File[]) => {
    const problems: string[] = [];
    const valid: UploadedFile[] = [];

    for (const file of incoming) {
      if (!isAccepted(file)) {
        problems.push(`${file.name}: only images and PDFs are allowed.`);
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        problems.push(`${file.name}: larger than ${maxSizeMB}MB.`);
        continue;
      }
      const duplicate =
        files.some((f) => f.name === file.name && f.file?.size === file.size) ||
        valid.some((f) => f.name === file.name && f.file?.size === file.size);
      if (duplicate) {
        problems.push(`${file.name}: already added.`);
        continue;
      }
      if (valid.length >= remaining) {
        problems.push(`${file.name}: limit of ${maxFiles} files reached.`);
        continue;
      }
      valid.push({
        name: file.name,
        size: formatSize(file.size),
        type: file.type,
        url: URL.createObjectURL(file),
        file,
      });
    }

    setErrors(problems);
    if (valid.length > 0) onChange([...files, ...valid]);
  };

  const removeAt = (index: number) => {
    const target = files[index];
    if (target?.url?.startsWith("blob:")) URL.revokeObjectURL(target.url);
    setErrors([]);
    onChange(files.filter((_, i) => i !== index));
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    if (!isFull) setDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (isFull) {
      setErrors([`You can attach up to ${maxFiles} files per patient.`]);
      return;
    }
    addFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium opacity-70">
          {label}{" "}
          <span className="font-normal opacity-60">
            (lab reports, images, PDFs)
          </span>
        </label>
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{
            color: isFull ? accent : undefined,
            opacity: isFull ? 1 : 0.6,
          }}
        >
          {files.length} / {maxFiles}
        </span>
      </div>

      {/* Drop area */}
      <div
        role="button"
        tabIndex={isFull ? -1 : 0}
        aria-disabled={isFull}
        aria-label="Upload files. Drag and drop or press Enter to browse."
        onClick={() => !isFull && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!isFull && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-6 py-7 text-center outline-none transition-colors ${
          isFull ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        }`}
        style={{
          backgroundColor: dragging ? `${accent}10` : ui.inner,
          borderColor: dragging ? accent : ui.border,
        }}
      >
        <span
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full transition-colors"
          style={{
            backgroundColor: dragging ? accent : `${accent}15`,
            color: dragging ? "#fff" : accent,
          }}
        >
          <Upload size={18} />
        </span>
        <p className="text-xs font-semibold">
          {isFull
            ? "Attachment limit reached"
            : dragging
            ? "Drop to attach"
            : "Drag files here, or click to browse"}
        </p>
        <p className="text-[11px] opacity-50">
          {isFull
            ? "Remove a file to add another."
            : `PNG, JPG or PDF, up to ${maxSizeMB}MB each. ${remaining} more allowed.`}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept.join(",")}
          className="hidden"
          onChange={(e) => {
            addFiles(Array.from(e.target.files || []));
            e.target.value = ""; // allow re-selecting the same file
          }}
        />
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div
          role="alert"
          className="space-y-0.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] text-red-500"
        >
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {files.map((file, idx) => {
            const isImage = file.type.startsWith("image/");
            return (
              <div
                key={`${file.name}-${idx}`}
                className="flex items-center justify-between gap-2 rounded-2xl border p-2.5"
                style={{ backgroundColor: ui.inner, borderColor: ui.border }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {isImage ? (
                    <div
                      className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border"
                      style={{ borderColor: ui.border }}
                    >
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${accent}15`, color: accent }}
                    >
                      <FileText size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {file.name}
                    </p>
                    <p className="text-[10px] opacity-50">{file.size}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-1.5 opacity-60 transition hover:opacity-100"
                    title="Preview file"
                    aria-label={`Preview ${file.name}`}
                  >
                    <Eye size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={() => removeAt(idx)}
                    className="rounded-lg p-1.5 text-red-500 opacity-60 transition hover:opacity-100"
                    title="Remove file"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
