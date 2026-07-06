import type { Node, Edge } from "@xyflow/react";

export type NodeKind = "start" | "plainMessage" | "buttonMessage" | "templateMessage" | "flowMessage";

export interface FlowButton {
  id: string; // used as sourceHandle, e.g. "buy_btn"
  title: string; // shown to the user, max 20 chars (WhatsApp limit)
}

export interface PlainMessageData {
  message: string;
  [key: string]: unknown;
}

export interface ButtonMessageData {
  message: string;
  buttons: FlowButton[];
  [key: string]: unknown;
}

export interface StartData {
  label: string;
  [key: string]: unknown;
}

export type FlowNodeData = PlainMessageData | ButtonMessageData | StartData;

export type FlowNode = Node<FlowNodeData>;
export type FlowEdge = Edge;

export interface FlowDocument {
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  updatedAt: string;
}

/* ---- Simulator (frontend replacement for the WhatsApp session engine) ---- */

export interface ChatMessage {
  id: string;
  from: "bot" | "user" | "system";
  text: string;
  buttons?: FlowButton[]; // present on interactive bot messages
  answered?: boolean; // buttons already used
}

export interface SimSession {
  currentNodeId: string | null;
  waitingForButton: boolean;
  waitingNodeId: string | null;
  ended: boolean;
}
