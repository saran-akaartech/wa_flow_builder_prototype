"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { PlainMessageData } from "@/lib/types";

export default function PlainMessageNode({ data, selected }: NodeProps) {
  const d = data as PlainMessageData;
  return (
    <div
      className={`w-64 rounded-xl border bg-ink-800 shadow-panel transition-colors ${
        selected ? "border-wa-green" : "border-line"
      }`}
    >
      <Handle type="target" position={Position.Top} id="in" />
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-wa-teal/20 text-wa-green">
          <ChatIcon />
        </span>
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Message
        </span>
      </div>
      <div className="px-3 py-3">
        <p className="min-h-[1.25rem] whitespace-pre-wrap break-words text-sm text-slate-200">
          {d.message?.trim() || (
            <span className="italic text-slate-500">Empty message…</span>
          )}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} id="out" />
    </div>
  );
}

function ChatIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
