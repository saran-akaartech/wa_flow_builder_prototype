"use client";

import { useEffect, useRef, useState } from "react";
import type { FlowNode, FlowEdge, ChatMessage, SimSession, FlowButton } from "@/lib/types";
import { startFlow, continueFromButton } from "@/lib/flowExecutor";
import { Button } from "./ui/primitives";

interface Props {
  open: boolean;
  onClose: () => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const TRIGGERS = ["hi", "hello", "start"];

export default function SimulatorPanel({ open, onClose, nodes, edges }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<SimSession | null>(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const begin = () => {
    setMessages([{ id: "u_hi", from: "user", text: "hi" }]);
    const res = startFlow(nodes, edges);
    setMessages((prev) => [...prev, ...res.messages]);
    setSession(res.session);
  };

  // (Re)start whenever the simulator is opened.
  useEffect(() => {
    if (open) begin();
    else {
      setMessages([]);
      setSession(null);
      setDraft("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!open) return null;

  const onButton = (waitingNodeId: string, btn: FlowButton, msgId: string) => {
    // Echo the user's choice and lock that message's buttons.
    setMessages((prev) =>
      prev
        .map((m) => (m.id === msgId ? { ...m, answered: true } : m))
        .concat({ id: `u_${btn.id}_${Date.now()}`, from: "user", text: btn.title })
    );
    const res = continueFromButton(waitingNodeId, btn.id, nodes, edges);
    setMessages((prev) => [...prev, ...res.messages]);
    setSession(res.session);
  };

  const sendDraft = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (TRIGGERS.includes(text.toLowerCase())) {
      // Trigger word — reset the session and start the flow.
      setMessages([{ id: `u_${Date.now()}`, from: "user", text }]);
      const res = startFlow(nodes, edges);
      setMessages((prev) => [...prev, ...res.messages]);
      setSession(res.session);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, from: "user", text },
      {
        id: `s_${Date.now()}`,
        from: "system",
        text: session?.waitingForButton
          ? "Tap one of the buttons above to continue."
          : `Send ${TRIGGERS.map((t) => `“${t}”`).join(", ")} to start the flow.`,
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="flex h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-line bg-wa-ink shadow-2xl">
        {/* chat header */}
        <div className="flex items-center justify-between bg-wa-panel px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-wa-teal text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.4A10 10 0 1 0 12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Test Bot</p>
              <p className="text-[11px] text-wa-green">simulation · not live</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              className="h-8 px-2 text-xs text-slate-300"
              onClick={begin}
            >
              Restart
            </Button>
            <Button
              variant="ghost"
              className="h-8 w-8 px-0 text-slate-300"
              onClick={onClose}
              aria-label="Close simulator"
            >
              ×
            </Button>
          </div>
        </div>

        {/* messages */}
        <div
          ref={scrollRef}
          className="scroll-thin flex-1 space-y-2 overflow-y-auto px-3 py-4"
          style={{
            backgroundColor: "#0b141a",
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }}
        >
          {messages.map((m) => (
            <MessageBubble key={m.id} msg={m} onButton={onButton} session={session} />
          ))}
        </div>

        {/* input */}
        <div className="flex items-center gap-2 bg-wa-panel px-3 py-2.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendDraft()}
            placeholder="Type hi, hello or start…"
            className="flex-1 rounded-full bg-ink-700 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={sendDraft}
            className="grid h-9 w-9 place-items-center rounded-full bg-wa-green text-wa-ink"
            aria-label="Send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  onButton,
  session,
}: {
  msg: ChatMessage;
  onButton: (waitingNodeId: string, btn: FlowButton, msgId: string) => void;
  session: SimSession | null;
}) {
  if (msg.from === "system") {
    return (
      <div className="flex justify-center">
        <span className="rounded-md bg-black/30 px-2.5 py-1 text-[11px] text-slate-400">
          {msg.text}
        </span>
      </div>
    );
  }

  const isBot = msg.from === "bot";
  const canTap = isBot && msg.buttons && !msg.answered && session?.waitingForButton;

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
          isBot ? "bg-wa-panel text-slate-100" : "bg-wa-bubble text-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
        {msg.buttons && msg.buttons.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
            {msg.buttons.map((btn) => (
              <button
                key={btn.id}
                disabled={!canTap}
                onClick={() => session?.waitingNodeId && onButton(session.waitingNodeId, btn, msg.id)}
                className={`block w-full rounded-md py-1.5 text-center text-sm font-medium transition-colors ${
                  canTap
                    ? "text-wa-green hover:bg-white/5"
                    : "cursor-default text-slate-500"
                }`}
              >
                {btn.title?.trim() || btn.id}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
