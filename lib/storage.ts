import type { FlowDocument, FlowNode, FlowEdge } from "./types";

const STORAGE_KEY = "wa-flow-builder:default";

/**
 * localStorage stands in for the MongoDB `flows` collection.
 * A single flow is persisted under the "default" name, mirroring the prototype spec.
 */
export function saveFlow(nodes: FlowNode[], edges: FlowEdge[]): FlowDocument {
  const doc: FlowDocument = {
    name: "default",
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
  return doc;
}

export function loadFlow(): FlowDocument | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FlowDocument;
  } catch {
    return null;
  }
}

export function exportFlowJson(nodes: FlowNode[], edges: FlowEdge[]): string {
  const doc: FlowDocument = {
    name: "default",
    nodes,
    edges,
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(doc, null, 2);
}

export function parseFlowJson(text: string): FlowDocument {
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
    throw new Error("Invalid flow file: expected `nodes` and `edges` arrays.");
  }
  return parsed as FlowDocument;
}

export function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
