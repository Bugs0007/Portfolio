import type { DiagramSpec } from "../diagram-spec";

// Three lanes rather than one flow, because there are three separable systems
// here and forcing them onto a single left-to-right line is what produces the
// crowding this rebuild exists to fix. Ingest leads, since it is the hard part.
// Retrieval is the depth. Practice is what the product actually does all day.
// Underneath all three, one dimmed rail for what it runs on.
//
// Density rule applied throughout: a node is a real component or step. The
// specifics that make it interesting (the rotating header key, per-document
// column detection, the cross-encoder model name) are sublabels or label-band
// notes, sized smaller, never boxes of their own.
export const caseintelDiagram: DiagramSpec = {
  id: "caseintel",
  headline: { value: "360", label: "tests passing" },
  lanes: [
    {
      id: "ingest",
      label: "ingest",
      rows: [
        {
          id: "portal",
          items: [
            { id: "ecourts", label: "eCourts portal" },
            { id: "session", label: "Session init", sub: "cookies + rotating header" },
            { id: "captcha", label: "CAPTCHA solve" },
            { id: "advocate", label: "Advocate search", sub: "districts x court complexes" },
            { id: "job", label: "ProcessingJob", sub: "async, incremental, concurrency cap" },
            { id: "caseimport", label: "Case import" },
            {
              id: "cnr",
              label: "CNR auto-detect",
              sub: "4-letter prefix picks the portal, falls back on CaseNotFound",
              kind: "chip",
              anchor: { to: "session", side: "top" },
            },
          ],
        },
      ],
    },
    {
      id: "retrieval",
      label: "retrieval",
      groups: [{ id: "langgraph", label: "LangGraph", members: ["hyde", "hybrid", "generate"] }],
      rows: [
        {
          id: "index",
          items: [
            { id: "pdf", label: "PDF upload" },
            { id: "dedupe", label: "SHA-256 dedupe" },
            { id: "chunk", label: "spaCy chunking", sub: "sentence-aware" },
            { id: "embed", label: "Embeddings", sub: "768-dim" },
            { id: "vec", label: "pgvector + tsvector", sub: "hybrid index" },
          ],
        },
        {
          // The query side, entering from the index above it.
          id: "query",
          depthOffset: 1,
          items: [
            { id: "query", label: "Query" },
            { id: "hyde", label: "hyde_expand", sub: "HyDE expansion", kind: "chip" },
            { id: "hybrid", label: "hybrid_search", sub: "vector + full text", kind: "chip" },
            { id: "generate", label: "generate_answer", kind: "chip" },
            { id: "answer", label: "Sourced answer", kind: "sink" },
          ],
        },
        {
          // The rerank detour lives in its own row so the LangGraph boundary
          // stays a boundary around three nodes and not four.
          id: "rerank",
          depthOffset: 2,
          items: [
            { id: "rrf", label: "RRF rerank", sub: "reciprocal rank fusion" },
            { id: "cross", label: "Cross-encoder", sub: "ms-marco-MiniLM-L-6-v2" },
          ],
        },
      ],
    },
    {
      id: "practice",
      label: "practice",
      groups: [
        {
          id: "hearing",
          label: "hearing state",
          members: ["notchecked", "notpublished", "listed", "notlisted"],
        },
        { id: "fee", label: "AppearanceFee", members: ["pending", "invoiced", "paid"] },
      ],
      rows: [
        {
          id: "lists",
          items: [
            { id: "cron", label: "cron", sub: "7pm / 6:30am" },
            { id: "captcha2", label: "CAPTCHA" },
            { id: "pdfs", label: "58 PDFs", sub: "8 list types" },
            { id: "pdfminer", label: "pdfminer parsing", sub: "per-document column detection" },
            { id: "notchecked", label: "not_checked", kind: "chip" },
            { id: "notpublished", label: "not_published", kind: "chip" },
            {
              id: "outcome",
              stack: [
                { id: "listed", label: "listed", kind: "chip" },
                { id: "notlisted", label: "not_listed", kind: "chip" },
              ],
            },
          ],
        },
        {
          id: "billing",
          depthOffset: 2,
          items: [
            { id: "pending", label: "PENDING", kind: "chip" },
            { id: "invoiced", label: "INVOICED", kind: "chip" },
            { id: "paid", label: "PAID", kind: "chip" },
            { id: "fpdf", label: "fpdf2 PDF", kind: "chip" },
          ],
        },
      ],
    },
  ],
  rail: {
    id: "infra",
    label: "runs on",
    items: [
      { id: "ec2", label: "AWS EC2", sub: "t3.small", kind: "infra" },
      { id: "rds", label: "RDS PostgreSQL", sub: "pgvector", kind: "infra" },
      { id: "web", label: "Nginx / gunicorn", sub: "systemd", kind: "infra" },
      { id: "tls", label: "Let's Encrypt", kind: "infra" },
      { id: "ci", label: "GitHub Actions", kind: "infra" },
      { id: "domain", label: "caseintel.in", kind: "infra" },
    ],
    badge: {
      id: "tenancy",
      label: "row-level multi-tenancy",
      sub: "OwnedModel, 16 models, DRF token auth",
      kind: "infra",
    },
  },
  edges: [
    // Ingest
    {
      id: "ecourts-session",
      from: "ecourts",
      to: "session",
      label: { text: "header key scraped per session from components.js" },
    },
    { id: "cnr-gate", from: "cnr", to: { onEdge: "ecourts-session", t: 0.6 }, kind: "aside" },
    { id: "session-captcha", from: "session", to: "captcha" },
    {
      id: "captcha-advocate",
      from: "captcha",
      to: "advocate",
      label: { metric: "districts scanned" },
    },
    { id: "advocate-job", from: "advocate", to: "job", label: { text: "500-result cap" } },
    {
      id: "job-import",
      from: "job",
      to: "caseimport",
      label: { text: "retry failed districts" },
    },

    // Retrieval, index side
    { id: "pdf-dedupe", from: "pdf", to: "dedupe" },
    { id: "dedupe-chunk", from: "dedupe", to: "chunk" },
    { id: "chunk-embed", from: "chunk", to: "embed" },
    { id: "embed-vec", from: "embed", to: "vec" },

    // Retrieval, query side
    { id: "query-hyde", from: "query", to: "hyde", label: { metric: "LangGraph pipeline" } },
    { id: "hyde-hybrid", from: "hyde", to: "hybrid" },
    { id: "vec-hybrid", from: { node: "vec", port: "b" }, to: { node: "hybrid", port: "t" }, kind: "aside" },
    { id: "hybrid-rrf", from: { node: "hybrid", port: "b" }, to: { node: "rrf", port: "t" } },
    { id: "rrf-cross", from: "rrf", to: "cross" },
    { id: "cross-generate", from: { node: "cross", port: "t" }, to: { node: "generate", port: "b" } },
    { id: "generate-answer", from: "generate", to: "answer" },

    // Practice, cause lists
    { id: "cron-captcha2", from: "cron", to: "captcha2" },
    { id: "captcha2-pdfs", from: "captcha2", to: "pdfs" },
    { id: "pdfs-pdfminer", from: "pdfs", to: "pdfminer", label: { metric: "list types read" } },
    { id: "pdfminer-state", from: "pdfminer", to: "notchecked" },
    {
      id: "state-published",
      from: "notchecked",
      to: "notpublished",
      label: { text: "never downgrades" },
    },
    { id: "state-listed", from: "notpublished", to: "listed" },
    { id: "state-notlisted", from: "notpublished", to: "notlisted" },

    // Practice, billing
    {
      id: "pending-invoiced",
      from: "pending",
      to: "invoiced",
      label: { text: "row-locked per-user invoice sequence" },
    },
    { id: "invoiced-paid", from: "invoiced", to: "paid" },
    { id: "paid-fpdf", from: "paid", to: "fpdf", kind: "aside" },
  ],
  // CaseIntel has exactly one bullet in site.ts, and this is the node it names.
  bulletNodes: ["hybrid"],
};
