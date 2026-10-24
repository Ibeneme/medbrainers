import React from "react";
import { EMAILS } from "@/constants/site";
import type { LegalBlock, LegalDoc } from "@/content/legal/types";

/** Turns **bold**, *italic* and {email} into React nodes. */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\{email\})/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part === "{email}") {
      return (
        <a
          key={i}
          href={`mailto:${EMAILS.support}`}
          className="text-primary-light underline hover:text-primary-light/90"
        >
          {EMAILS.support}
        </a>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function Block({ block }: { block: LegalBlock }) {
  if ("p" in block) return <p>{renderInline(block.p)}</p>;
  if ("caps" in block)
    return <p className="uppercase text-sm tracking-wide text-white/60">{block.caps}</p>;
  if ("note" in block) return <p className="text-sm text-white/50 pt-2">{block.note}</p>;
  if ("email" in block) return <p>{renderInline("{email}")}</p>;
  return (
    <ul className="list-disc pl-6 space-y-2 text-white/70">
      {block.ul.map((item, i) => (
        <li key={i}>{renderInline(item)}</li>
      ))}
    </ul>
  );
}

export default function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-5 sm:px-6 pb-24 pt-32 md:pt-40 text-white">
      <div className="space-y-12 text-white/80 font-light leading-relaxed">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{doc.title}</h1>
          <p className="text-sm text-white/50">{doc.updated}</p>
        </header>

        {doc.sections.map((section) => (
          <section key={section.h} className="space-y-4">
            <h2 className="text-2xl font-bold text-white tracking-tight">{section.h}</h2>
            {section.blocks.map((block, i) => (
              <Block key={i} block={block} />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
