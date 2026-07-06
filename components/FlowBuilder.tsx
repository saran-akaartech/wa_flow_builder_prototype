"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Connection,
  type NodeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import NodeEditorPanel from "./NodeEditorPanel";
import SimulatorPanel from "./SimulatorPanel";
import StartNode from "./nodes/StartNode";
import PlainMessageNode from "./nodes/PlainMessageNode";
import ButtonMessageNode from "./nodes/ButtonMessageNode";

import type { FlowNode, FlowEdge, ButtonMessageData } from "@/lib/types";
import {
  saveFlow,
  loadFlow,
  exportFlowJson,
  parseFlowJson,
  downloadJson,
} from "@/lib/storage";

let idCounter = 100;
const newId = () => `n_${idCounter++}`;

const nodeTypes: NodeTypes = {
  start: StartNode,
  plainMessage: PlainMessageNode,
  buttonMessage: ButtonMessageNode,
};

/* A small seeded example so Run test works immediately. */
const initialNodes: FlowNode[] = [
  { id: "start", type: "start", position: { x: 80, y: 40 }, data: { label: "Start" }, deletable: false },
  { id: "n_1", type: "plainMessage", position: { x: 40, y: 150 }, data: { message: "Welcome to Zenith Lab! 👋" } },
  { id: "n_2", type: "plainMessage", position: { x: 40, y: 290 }, data: { message: "How can we help you today?" } },
  {
    id: "n_3",
    type: "buttonMessage",
    position: { x: 40, y: 430 },
    data: {
      message: "Pick an option:",
      buttons: [
        { id: "buy_btn", title: "Buy" },
        { id: "support_btn", title: "Support" },
      ],
    } as ButtonMessageData,
  },
  { id: "n_4", type: "plainMessage", position: { x: 380, y: 470 }, data: { message: "Great — our sales team will reach out. 🛒" } },
  { id: "n_5", type: "plainMessage", position: { x: 380, y: 610 }, data: { message: "Connecting you with support. 🛠️" } },
];

const initialEdges: FlowEdge[] = [
  { id: "e0", source: "start", sourceHandle: "start_out", target: "n_1" },
  { id: "e1", source: "n_1", sourceHandle: "out", target: "n_2" },
  { id: "e2", source: "n_2", sourceHandle: "out", target: "n_3" },
  { id: "e3", source: "n_3", sourceHandle: "buy_btn", target: "n_4" },
  { id: "e4", source: "n_3", sourceHandle: "support_btn", target: "n_5" },
];

function Builder() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [status, setStatus] = useState<string>("");

  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const flash = (msg: string) => {
    setStatus(msg);
    window.setTimeout(() => setStatus(""), 2200);
  };

  /* ---- connections: enforce one edge per source handle ---- */
  const onConnect = useCallback(
    (conn: Connection) => {
      setEdges((eds) => {
        const cleaned = eds.filter(
          (e) => !(e.source === conn.source && e.sourceHandle === conn.sourceHandle)
        );
        return addEdge(conn, cleaned);
      });
    },
    [setEdges]
  );

  /* ---- drag & drop from the sidebar ---- */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const kind = e.dataTransfer.getData("application/reactflow");
      if (kind !== "plainMessage" && kind !== "buttonMessage") return;

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const id = newId();
      const node: FlowNode =
        kind === "plainMessage"
          ? { id, type: "plainMessage", position, data: { message: "New message" } }
          : {
              id,
              type: "buttonMessage",
              position,
              data: {
                message: "Choose an option",
                buttons: [{ id: `btn_${Math.random().toString(36).slice(2, 8)}`, title: "Button 1" }],
              } as ButtonMessageData,
            };

      setNodes((nds) => nds.concat(node));
      setSelectedId(id);
    },
    [screenToFlowPosition, setNodes]
  );

  /* ---- editing ---- */
  const updateNodeData = useCallback(
    (nodeId: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === nodeId ? ({ ...n, data: { ...data } } as FlowNode) : n))
      );
      // Prune edges whose sourceHandle no longer exists (e.g. a button was removed).
      if ("buttons" in data) {
        const validHandles = new Set(
          ((data.buttons as { id: string }[]) ?? []).map((b) => b.id)
        );
        setEdges((eds) =>
          eds.filter(
            (e) => e.source !== nodeId || !e.sourceHandle || validHandles.has(e.sourceHandle)
          )
        );
      }
    },
    [setNodes, setEdges]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      if (nodeId === "start") return;
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedId(null);
    },
    [setNodes, setEdges]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedId(node.id);
  }, []);

  /* ---- top bar actions ---- */
  const handleSave = () => {
    saveFlow(nodes, edges);
    flash("Flow saved to this browser");
  };

  const handleLoad = () => {
    const doc = loadFlow();
    if (!doc) {
      flash("No saved flow found yet");
      return;
    }
    setNodes(doc.nodes as FlowNode[]);
    setEdges(doc.edges as FlowEdge[]);
    setSelectedId(null);
    flash("Flow loaded");
  };

  const handleExport = () => {
    downloadJson("whatsapp-flow.json", exportFlowJson(nodes, edges));
    flash("Exported whatsapp-flow.json");
  };

  const handleImport = (text: string) => {
    try {
      const doc = parseFlowJson(text);
      setNodes(doc.nodes as FlowNode[]);
      setEdges(doc.edges as FlowEdge[]);
      setSelectedId(null);
      flash("Flow imported");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Could not read that file");
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <Topbar
        onSave={handleSave}
        onLoad={handleLoad}
        onExport={handleExport}
        onImport={handleImport}
        onRunTest={() => setSimOpen(true)}
        status={status}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar />

        <div className="relative min-w-0 flex-1" ref={wrapperRef} onDrop={onDrop} onDragOver={onDragOver}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={() => setSelectedId(null)}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: "smoothstep" }}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#22303d" />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) =>
                n.type === "buttonMessage" ? "#f59e0b" : n.type === "start" ? "#25d366" : "#128c7e"
              }
              maskColor="rgba(8, 14, 20, 0.7)"
              style={{ backgroundColor: "#0f1720", border: "1px solid #26323f", borderRadius: 10 }}
            />
          </ReactFlow>
        </div>

        <NodeEditorPanel node={selectedNode} onChange={updateNodeData} onDelete={deleteNode} />
      </div>

      <SimulatorPanel open={simOpen} onClose={() => setSimOpen(false)} nodes={nodes} edges={edges} />
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <Builder />
    </ReactFlowProvider>
  );
}
