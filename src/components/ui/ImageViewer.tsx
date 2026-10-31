"use client";

import { useState } from "react";
import { FileText, Image as ImageIcon, X, ExternalLink } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

export interface StudyInstanceItem {
  b2Key?: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface InstancesGalleryProps {
  instances: StudyInstanceItem[];
  ui: {
    card: string;
    border: string;
    inner: string;
    text: string;
  };
}

function formatWhen(iso?: string): string {
  if (!iso) return "N/A";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InstancesGallery({
  instances,
  ui,
}: InstancesGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<StudyInstanceItem | null>(null);

  if (!instances || instances.length === 0) return null;

  return (
    <>
      <div
        className="rounded-[22px] p-5 border space-y-4"
        style={{ backgroundColor: ui.card, borderColor: ui.border }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} style={{ color: PRIMARY_COLOR }} />
            <p className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              Study Images & Instances
            </p>
          </div>
          <span className="text-xs font-semibold opacity-70">
            {instances.length} file(s)
          </span>
        </div>

        {/* Instances Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {instances.map((instance, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedImage(instance)}
              className="group relative rounded-xl overflow-hidden border cursor-pointer transition hover:scale-[1.02]"
              style={{
                backgroundColor: ui.inner,
                borderColor: ui.border,
              }}
            >
              <div className="aspect-square w-full relative bg-black/20 flex items-center justify-center">
                {instance.mimeType?.startsWith("image/") ? (
                  <img
                    src={instance.url}
                    alt={instance.fileName || `Instance ${idx + 1}`}
                    className="object-cover w-full h-full transition group-hover:opacity-95"
                  />
                ) : (
                  <FileText size={32} className="opacity-50" />
                )}
              </div>
              <div className="p-2">
                <p className="text-[11px] font-bold truncate">
                  {instance.fileName || `Instance ${idx + 1}`}
                </p>
                <p className="text-[9px] opacity-50">
                  {(instance.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Modal Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="relative max-w-3xl w-full rounded-[24px] border overflow-hidden shadow-2xl flex flex-col"
            style={{
              backgroundColor: ui.card,
              borderColor: ui.border,
              color: ui.text,
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: ui.border }}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">
                  {selectedImage.fileName}
                </p>
                <p className="text-[10px] opacity-60">
                  Uploaded {formatWhen(selectedImage.uploadedAt)} •{" "}
                  {(selectedImage.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:opacity-80"
                  style={{ borderColor: ui.border, backgroundColor: ui.inner }}
                  title="Open original"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border transition hover:opacity-80"
                  style={{ borderColor: ui.border, backgroundColor: ui.inner }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / Image */}
            <div className="p-4 flex items-center justify-center bg-black/40 max-h-[70vh] overflow-auto">
              <img
                src={selectedImage.url}
                alt={selectedImage.fileName}
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}