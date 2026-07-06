"use client";

import type { FlowNode, ButtonMessageData, PlainMessageData, FlowButton } from "@/lib/types";
import { Button, Card, Input, Label, Textarea } from "./ui/primitives";

interface Props {
  node: FlowNode | null;
  onChange: (nodeId: string, data: Record<string, unknown>) => void;
  onDelete: (nodeId: string) => void;
}

function makeButtonId() {
  return `btn_${Math.random().toString(36).slice(2, 8)}`;
}

export default function NodeEditorPanel({ node, onChange, onDelete }: Props) {
  if (!node) {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-ink-800">
        <PanelHeader title="Editor" />
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <p className="text-sm text-slate-500">
            Select a node on the canvas to edit its message and buttons.
          </p>
        </div>
      </aside>
    );
  }

  if (node.type === "start") {
    return (
      <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-ink-800">
        <PanelHeader title="Start node" />
        <div className="p-4">
          <Card className="p-4">
            <p className="text-sm text-slate-300">
              This is the entry point. In a live bot it fires when the user sends{" "}
              <code className="rounded bg-ink-900 px-1 text-wa-green">hi</code>,{" "}
              <code className="rounded bg-ink-900 px-1 text-wa-green">hello</code>{" "}
              or{" "}
              <code className="rounded bg-ink-900 px-1 text-wa-green">start</code>.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Connect its handle to the first node in your flow.
            </p>
          </Card>
        </div>
      </aside>
    );
  }

  const isButtons = node.type === "buttonMessage";
  const data = node.data as PlainMessageData & ButtonMessageData;
  const buttons: FlowButton[] = isButtons ? data.buttons ?? [] : [];

  const setMessage = (message: string) => onChange(node.id, { ...data, message });

  const setButton = (id: string, title: string) => {
    const next = buttons.map((b) => (b.id === id ? { ...b, title } : b));
    onChange(node.id, { ...data, buttons: next });
  };

  const addButton = () => {
    if (buttons.length >= 3) return;
    const next = [...buttons, { id: makeButtonId(), title: `Button ${buttons.length + 1}` }];
    onChange(node.id, { ...data, buttons: next });
  };

  const removeButton = (id: string) => {
    onChange(node.id, { ...data, buttons: buttons.filter((b) => b.id !== id) });
  };

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-ink-800">
      <PanelHeader title={isButtons ? "Buttons node" : "Message node"} />

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <Label>Message text</Label>
          <Textarea
            rows={4}
            value={data.message ?? ""}
            placeholder="Type the message the bot sends…"
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {isButtons && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="mb-0">Buttons ({buttons.length}/3)</Label>
              <Button
                variant="ghost"
                className="h-7 px-2 py-0 text-xs"
                onClick={addButton}
                disabled={buttons.length >= 3}
              >
                + Add
              </Button>
            </div>

            <div className="space-y-2">
              {buttons.map((btn) => (
                <Card key={btn.id} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      value={btn.title}
                      maxLength={20}
                      placeholder="Button label"
                      onChange={(e) => setButton(btn.id, e.target.value)}
                    />
                    <Button
                      variant="danger"
                      className="h-8 w-8 px-0"
                      onClick={() => removeButton(btn.id)}
                      aria-label="Remove button"
                    >
                      ×
                    </Button>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-slate-500">
                    handle: {btn.id}
                  </p>
                </Card>
              ))}
              {buttons.length === 0 && (
                <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-xs text-slate-500">
                  No buttons. Add up to 3 — each gets its own outgoing handle.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-line p-4">
        <Button
          variant="danger"
          className="w-full border border-red-500/30"
          onClick={() => onDelete(node.id)}
        >
          Delete node
        </Button>
      </div>
    </aside>
  );
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-line px-4 py-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
    </div>
  );
}
