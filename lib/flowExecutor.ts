import type {
  FlowNode,
  FlowEdge,
  ChatMessage,
  SimSession,
  ButtonMessageData,
  PlainMessageData,
  FlowButton,
} from "./types";

const MAX_STEPS = 200; // cycle guard

let counter = 0;
const uid = () => `m_${Date.now().toString(36)}_${(counter++).toString(36)}`;

export interface RunResult {
  messages: ChatMessage[];
  session: SimSession;
}

const ended: SimSession = {
  currentNodeId: null,
  waitingForButton: false,
  waitingNodeId: null,
  ended: true,
};

function getNode(id: string | null, nodes: FlowNode[]): FlowNode | undefined {
  if (!id) return undefined;
  return nodes.find((n) => n.id === id);
}

export function findStartNode(nodes: FlowNode[]): FlowNode | undefined {
  return nodes.find((n) => n.type === "start");
}

/** First edge leaving a node, ignoring sourceHandle (used by plain + start nodes). */
function nextEdge(nodeId: string, edges: FlowEdge[]): FlowEdge | undefined {
  return edges.find((e) => e.source === nodeId);
}

/** Walk the graph from a node, auto-running plain nodes until a button node or the end. */
function runFrom(startNodeId: string | null, nodes: FlowNode[], edges: FlowEdge[]): RunResult {
  const messages: ChatMessage[] = [];
  let cursor: string | null = startNodeId;
  let steps = 0;

  while (cursor && steps < MAX_STEPS) {
    const node = getNode(cursor, nodes);
    if (!node) {
      messages.push({
        id: uid(),
        from: "system",
        text: "Flow ended — the last edge points to a node that no longer exists.",
      });
      return { messages, session: ended };
    }

    if (node.type === "plainMessage") {
      const data = node.data as PlainMessageData;
      messages.push({
        id: uid(),
        from: "bot",
        text: data.message?.trim() || "(empty message)",
      });
      cursor = nextEdge(node.id, edges)?.target ?? null;
    } else if (node.type === "buttonMessage") {
      const data = node.data as ButtonMessageData;
      const buttons = (data.buttons ?? []).slice(0, 3) as FlowButton[];
      messages.push({
        id: uid(),
        from: "bot",
        text: data.message?.trim() || "(empty message)",
        buttons,
      });
      // Pause and wait for a button tap.
      return {
        messages,
        session: {
          currentNodeId: node.id,
          waitingForButton: true,
          waitingNodeId: node.id,
          ended: false,
        },
      };
    } else {
      // start / unknown — just follow the edge
      cursor = nextEdge(node.id, edges)?.target ?? null;
    }
    steps += 1;
  }

  if (steps >= MAX_STEPS) {
    messages.push({
      id: uid(),
      from: "system",
      text: "Stopped — the flow looped too many times. Check for a cycle.",
    });
  } else {
    messages.push({ id: uid(), from: "system", text: "— end of flow —" });
  }
  return { messages, session: ended };
}

/** Begin a run: find the Start node, follow its single edge, then execute. */
export function startFlow(nodes: FlowNode[], edges: FlowEdge[]): RunResult {
  const start = findStartNode(nodes);
  if (!start) {
    return {
      messages: [
        { id: uid(), from: "system", text: "No Start node found. Add one to begin." },
      ],
      session: ended,
    };
  }
  const first = nextEdge(start.id, edges)?.target ?? null;
  if (!first) {
    return {
      messages: [
        {
          id: uid(),
          from: "system",
          text: "The Start node isn't connected to anything yet. Draw an edge from Start.",
        },
      ],
      session: ended,
    };
  }
  return runFrom(first, nodes, edges);
}

/** Resume after a user taps a button: match sourceHandle === buttonId, continue from target. */
export function continueFromButton(
  waitingNodeId: string,
  buttonId: string,
  nodes: FlowNode[],
  edges: FlowEdge[]
): RunResult {
  const branch = edges.find(
    (e) => e.source === waitingNodeId && e.sourceHandle === buttonId
  );
  if (!branch) {
    return {
      messages: [
        {
          id: uid(),
          from: "system",
          text: "That button has no branch connected. Wire its handle to a node.",
        },
      ],
      session: ended,
    };
  }
  return runFrom(branch.target, nodes, edges);
}
