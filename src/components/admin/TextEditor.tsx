"use client";

// A plain writing box with Bold / List / Heading / Link buttons. It stores
// simple text (the same format src/components/RichText.tsx displays).
import { useRef } from "react";
import { Bold, Heading2, Link2, List } from "lucide-react";
import { cx } from "@/src/components/admin/ui";

export default function TextEditor({
  value,
  onChange,
  rows = 6,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  /** Replaces the selection and puts the cursor back in a sensible place. */
  const apply = (edit: (selected: string) => { text: string; selectFrom?: number; selectTo?: number }) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const result = edit(value.slice(start, end));
    onChange(value.slice(0, start) + result.text + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + (result.selectFrom ?? result.text.length), start + (result.selectTo ?? result.text.length));
    });
  };

  const bold = () => apply((s) => (s ? { text: `**${s}**` } : { text: "**bold text**", selectFrom: 2, selectTo: 11 }));
  const prefixLines = (prefix: string, sample: string) =>
    apply((s) => {
      const el = ref.current!;
      const atLineStart = el.selectionStart === 0 || value[el.selectionStart - 1] === "\n";
      const lead = atLineStart ? "" : "\n";
      if (!s) return { text: `${lead}${prefix}${sample}`, selectFrom: lead.length + prefix.length, selectTo: lead.length + prefix.length + sample.length };
      return { text: lead + s.split("\n").map((line) => (line.trim() ? `${prefix}${line.replace(/^\s*([-•*]|#{1,4})\s+/, "")}` : line)).join("\n") };
    });
  const link = () =>
    apply((s) => {
      const label = s || "link text";
      return { text: `[${label}](https://)`, selectFrom: label.length + 3, selectTo: label.length + 11 };
    });

  const tool = "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-200/70";

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-300 bg-white focus-within:border-brand-beryl focus-within:ring-2 focus-within:ring-brand-beryl/20">
      <div className="flex flex-wrap gap-0.5 border-b border-neutral-200 bg-neutral-50 px-1.5 py-1">
        <button type="button" onClick={bold} className={tool} title="Bold">
          <Bold size={14} /> Bold
        </button>
        <button type="button" onClick={() => prefixLines("- ", "List item")} className={tool} title="Bullet list">
          <List size={14} /> List
        </button>
        <button type="button" onClick={() => prefixLines("## ", "Heading")} className={tool} title="Heading">
          <Heading2 size={14} /> Heading
        </button>
        <button type="button" onClick={link} className={tool} title="Link">
          <Link2 size={14} /> Link
        </button>
      </div>
      <textarea
        ref={ref}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cx("block w-full resize-y border-0 bg-white px-3 py-2.5 text-sm leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400")}
      />
      <p className="border-t border-neutral-100 bg-neutral-50 px-3 py-1.5 text-[11px] text-neutral-500">
        Leave an empty line between paragraphs. Start a line with a dash (-) for a bullet point.
      </p>
    </div>
  );
}
