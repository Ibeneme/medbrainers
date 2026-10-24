"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { PRIMARY_COLOR } from "@/constants/colors";

export type GuideItem = {
  title: string;
  description: ReactNode;
};

interface PageGuideProps {
  title?: string;
  items: GuideItem[];
  isOpen: boolean;
  onClose: () => void;
  ui: {
    card: string;
    inner: string;
    text: string;
    border: string;
  };
}

export default function PageGuide({
  title = "Quick Guide",
  items,
  isOpen,
  onClose,
  ui,
}: PageGuideProps) {
  if (!isOpen) return null;

  return (
    <div
      className="w-full lg:col-span-1 p-6 rounded-[28px] flex flex-col justify-between animate-in fade-in duration-200"
      style={{ backgroundColor: ui.card, color: ui.text }}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 text-sm opacity-90">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl"
              style={{ backgroundColor: ui.inner }}
            >
              <h3 className="font-semibold mb-1">
                {index + 1}. {item.title}
              </h3>
              <p className="text-xs opacity-70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t mt-6" style={{ borderColor: ui.border }}>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-full text-xs font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          Got it, let's start
        </button>
      </div>
    </div>
  );
}
