"use client";

import { useRef } from "react";
import { Button } from "./ui/primitives";

interface TopbarProps {
  onSave: () => void;
  onLoad: () => void;
  onExport: () => void;
  onImport: (json: string) => void;
  onRunTest: () => void;
  status?: string;
}

export default function Topbar({
  onSave,
  onLoad,
  onExport,
  onImport,
  onRunTest,
  status,
}: TopbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(String(reader.result));
    reader.readAsText(file);
    e.target.value = ""; // allow re-importing the same file
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-ink-800 px-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-wa-green text-wa-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.8.8.8-2.7-.2-.3A8 8 0 1 1 12 20z" />
            <path d="M9 8c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.7c.1.2 0 .4 0 .5l-.5.6c-.1.1-.2.3 0 .5.3.6.8 1.2 1.5 1.5.2.1.4.1.5 0l.5-.6c.2-.2.4-.2.6-.1l1.6.8c.2.1.3.2.3.4 0 .5-.3 1.4-1.2 1.6-.8.2-1.9.1-3.8-1.6C8.9 12 8.4 10.8 8.3 10c-.1-.8.4-1.5.7-2z" />
          </svg>
        </span>
        <div>
          <h1 className="text-sm font-semibold leading-tight text-slate-100">
            WhatsApp Flow Builder
          </h1>
          {status ? (
            <p className="text-[11px] leading-tight text-wa-green">{status}</p>
          ) : (
            <p className="text-[11px] leading-tight text-slate-500">
              Frontend prototype · saves to your browser
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" onClick={onLoad}>
          Load
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()}>
          Import JSON
        </Button>
        <Button variant="ghost" onClick={onExport}>
          Export JSON
        </Button>
        <Button variant="outline" onClick={onSave}>
          Save flow
        </Button>
        <Button variant="primary" onClick={onRunTest}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          Run test
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </header>
  );
}
