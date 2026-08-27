// The two architecture diagrams pipeline mode draws, as data.
//
// Geometry only: every label here is a term that already appears in the item's
// own bullets or stack in src/content/site.ts, and every metric is a
// WorkMetric looked up by label rather than retyped, so the diagram cannot
// drift away from the prose it illustrates.

export type GraphNode = {
  id: string;
  x: number;
  y: number;
  label: string;
  sub?: string;
  // "chip" renders smaller and unfilled: the edge concerns (auth, scraping
  // techniques) that sit beside the main track rather than on it.
  kind?: "node" | "chip" | "sink";
  // Progress at which this node lights, 0 -> 1 across the diagram's own beat.
  at: number;
};

export type GraphEdge = {
  from: string;
  to: string;
  at: [number, number];
  // Looked up in the item's metrics[] by label, then drawn on this edge.
  metric?: string;
  dashed?: boolean;
};

export type Graph = {
  viewBox: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  // A dashed enclosure drawn behind a set of nodes, for the LangGraph cluster.
  cluster?: { x: number; y: number; w: number; h: number; label: string; at: number };
  // Index-aligned with the item's bullets: which node each bullet describes,
  // so the bullet brightens as the line reaches its node.
  bulletNodes: string[];
};

export const PIPELINE_GRAPHS: Record<string, Graph> = {
  brynklabs: {
    viewBox: "0 0 140 74",
    nodes: [
      { id: "inbound", x: 15, y: 30, label: "Inbound event", sub: "Gathr", at: 0.04 },
      { id: "auth", x: 30, y: 8, label: "JWT / OAuth2", sub: "RBAC", kind: "chip", at: 0.12 },
      { id: "api", x: 43, y: 30, label: "Django API", at: 0.14 },
      { id: "sqs", x: 68, y: 30, label: "AWS SQS", sub: "async", at: 0.32 },
      { id: "lambda", x: 95, y: 30, label: "Lambda workers", at: 0.48 },
      { id: "whatsapp", x: 124, y: 10, label: "WhatsApp", kind: "sink", at: 0.62 },
      { id: "email", x: 124, y: 30, label: "Email", kind: "sink", at: 0.65 },
      { id: "inapp", x: 124, y: 50, label: "In-app", kind: "sink", at: 0.68 },
      { id: "gha", x: 43, y: 64, label: "GitHub Actions", kind: "chip", at: 0.76 },
      { id: "ec2", x: 95, y: 64, label: "AWS EC2", kind: "chip", at: 0.9 },
    ],
    edges: [
      { from: "inbound", to: "api", at: [0.02, 0.16] },
      { from: "auth", to: "api", at: [0.1, 0.24], dashed: true },
      { from: "api", to: "sqs", at: [0.18, 0.36], metric: "events/day" },
      { from: "sqs", to: "lambda", at: [0.34, 0.5] },
      { from: "lambda", to: "whatsapp", at: [0.5, 0.64] },
      { from: "lambda", to: "email", at: [0.53, 0.67], metric: "onboarding effort" },
      { from: "lambda", to: "inapp", at: [0.56, 0.7], metric: "feature rollout time" },
      { from: "gha", to: "ec2", at: [0.74, 0.92], metric: "release cycle", dashed: true },
    ],
    // Index-aligned with brynklabs bullets in site.ts.
    bulletNodes: ["inbound", "api", "sqs", "auth", "gha", "inapp"],
  },

  caseintel: {
    viewBox: "0 0 140 74",
    nodes: [
      { id: "sessions", x: 20, y: 8, label: "sessions", kind: "chip", at: 0.1 },
      { id: "captcha", x: 42, y: 8, label: "CAPTCHA", kind: "chip", at: 0.14 },
      { id: "headers", x: 68, y: 8, label: "anti-scraping headers", kind: "chip", at: 0.18 },
      { id: "ecourts", x: 13, y: 32, label: "eCourts", sub: "33 districts", at: 0.04 },
      { id: "scrape", x: 42, y: 32, label: "Automated scrape", at: 0.22 },
      { id: "lg1", x: 72, y: 32, label: "retrieve", kind: "chip", at: 0.42 },
      { id: "lg2", x: 92, y: 32, label: "reason", kind: "chip", at: 0.46 },
      { id: "lg3", x: 110, y: 32, label: "cite", kind: "chip", at: 0.5 },
      { id: "pgvector", x: 92, y: 58, label: "pgvector", sub: "PostgreSQL", at: 0.66 },
      { id: "answer", x: 40, y: 58, label: "Source-referenced answer", kind: "sink", at: 0.84 },
    ],
    cluster: { x: 61, y: 24, w: 59, h: 16, label: "LangGraph", at: 0.38 },
    edges: [
      { from: "sessions", to: "scrape", at: [0.08, 0.22], dashed: true },
      { from: "captcha", to: "scrape", at: [0.12, 0.26], dashed: true },
      { from: "headers", to: "scrape", at: [0.16, 0.3], dashed: true },
      { from: "ecourts", to: "scrape", at: [0.02, 0.2], metric: "districts scanned" },
      { from: "scrape", to: "lg1", at: [0.3, 0.46], metric: "list types read" },
      { from: "lg1", to: "lg2", at: [0.44, 0.52] },
      { from: "lg2", to: "lg3", at: [0.48, 0.58] },
      { from: "lg3", to: "pgvector", at: [0.58, 0.72] },
      { from: "pgvector", to: "answer", at: [0.72, 0.9] },
    ],
    bulletNodes: ["lg2"],
  },
};
