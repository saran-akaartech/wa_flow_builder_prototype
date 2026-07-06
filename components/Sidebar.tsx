"use client";

import type { NodeKind } from "@/lib/types";

interface PaletteItem {
  kind: Exclude<NodeKind, "start">;
  label: string;
  hint: string;
  accent: string;
  icon: React.ReactNode;
}

const items: PaletteItem[] = [
  {
    kind: "plainMessage",
    label: "Message",
    hint: "Sends text, then auto-continues",
    accent: "text-wa-green",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    ),
  },
  {
    kind: "templateMessage",
    label: "Template",
    hint: "Sends pre-approved whatsapp templates",
    accent: "text-wa-green",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    ),
  },
  {
    kind: "flowMessage",
    label: "Flows",
    hint: "Use pre-filled flows",
    accent: "text-wa-green",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
      </svg>
    ),
  },
  {
    kind: "buttonMessage",
    label: "Buttons",
    hint: "Sends buttons, waits for a tap",
    accent: "text-amber-400",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="18" height="4" rx="1" />
        <rect x="3" y="14" width="18" height="4" rx="1" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const onDragStart = (e: React.DragEvent, kind: string) => {
    e.dataTransfer.setData("application/reactflow", kind);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-ink-800">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Nodes
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">Drag onto the canvas</p>
      </div>

      <div className="space-y-2 p-3">
        {items.map((item) => (
          <div
            key={item.kind}
            draggable
            onDragStart={(e) => onDragStart(e, item.kind)}
            className="group cursor-grab rounded-lg border border-line bg-ink-900 p-3 transition-colors hover:border-wa-green/50 active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <span className={`${item.accent}`}>{item.icon}</span>
              <span className="text-sm font-medium text-slate-100">
                {item.label}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-line p-3">
        <p className="text-[11px] leading-relaxed text-slate-500">
          The <span className="text-wa-green">Start</span> node is fixed. Connect
          it to the first node — that&apos;s where a run begins.
        </p>
      </div>
    </aside>
  );
}
