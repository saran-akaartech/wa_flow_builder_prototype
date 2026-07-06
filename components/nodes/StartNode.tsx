"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

export default function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={`rounded-full px-5 py-2.5 text-sm font-semibold tracking-wide
        bg-wa-green text-wa-ink shadow-lg shadow-wa-green/20
        ring-2 transition-colors ${
          selected ? "ring-white" : "ring-wa-green/40"
        }`}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-wa-ink/20">
          <span className="block h-0 w-0 border-y-[4px] border-l-[6px] border-y-transparent border-l-wa-ink" />
        </span>
        Start
      </div>
      <Handle type="source" position={Position.Bottom} id="start_out" />
    </div>
  );
}
