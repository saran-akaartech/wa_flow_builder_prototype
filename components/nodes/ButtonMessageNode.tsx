"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ButtonMessageData } from "@/lib/types";

export default function ButtonMessageNode({ data, selected }: NodeProps) {
  const d = data as ButtonMessageData;
  const buttons = (d.buttons ?? []).slice(0, 3);

  return (
    <div
      className={`w-64 rounded-xl border bg-ink-800 shadow-panel transition-colors ${
        selected ? "border-wa-green" : "border-line"
      }`}
    >
      <Handle type="target" position={Position.Top} id="in" />
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-amber-500/20 text-amber-400">
          <MenuIcon />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Buttons
        </span>
      </div>

      <div className="px-3 py-3">
        <p className="mb-3 min-h-[1.25rem] whitespace-pre-wrap break-words text-sm text-slate-200">
          {d.message?.trim() || (
            <span className="italic text-slate-500">Empty message…</span>
          )}
        </p>

        <div className="space-y-2">
          {buttons.length === 0 && (
            <p className="text-xs italic text-slate-500">No buttons yet</p>
          )}
          {buttons.map((btn) => (
            <div
              key={btn.id}
              className="relative rounded-lg border border-wa-teal/40 bg-wa-teal/10 px-3 py-1.5 text-center text-sm font-medium text-wa-green"
            >
              {btn.title?.trim() || btn.id}
              {/* Each button maps to a unique outgoing handle (sourceHandle === btn.id) */}
              <Handle
                type="source"
                position={Position.Right}
                id={btn.id}
                style={{ right: -18, top: "50%" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
