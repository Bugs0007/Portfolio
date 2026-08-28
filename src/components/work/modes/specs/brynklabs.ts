import type { DiagramSpec } from "../diagram-spec";

// Two lanes, because the two halves of this job answer different questions.
// The runtime lane is what happens when an event arrives. The deploy lane is
// what happens when code changes, and it is drawn dim, dashed and smaller so
// that difference reads before any of the labels do.
//
// Every string here is a term from the Brynklabs bullets or stack in
// src/content/site.ts, and every number arrives by metric lookup rather than
// being retyped, so the diagram cannot drift away from the prose beside it.
export const brynklabsDiagram: DiagramSpec = {
  id: "brynklabs",
  lanes: [
    {
      id: "runtime",
      label: "runtime",
      rows: [
        {
          id: "flow",
          items: [
            { id: "inbound", label: "Inbound event", sub: "Gathr" },
            { id: "api", label: "Django API" },
            { id: "sqs", label: "AWS SQS", sub: "async" },
            { id: "lambda", label: "Lambda workers" },
            {
              id: "fanout",
              // Left-aligned so the three arms leave Lambda at the same length
              // and read as one fan-out rather than three separate hops.
              align: "start",
              stack: [
                { id: "whatsapp", label: "WhatsApp", kind: "sink" },
                { id: "email", label: "Email", kind: "sink" },
                { id: "inapp", label: "In-app", kind: "sink" },
              ],
            },
            // Anchored, so it consumes no slot and adds no band height. It sits
            // over the API and its edge lands on the inbound path, which is
            // where the check actually happens. Anchored entries go last in the
            // list by convention, though the depth counter skips them anyway.
            {
              id: "auth",
              label: "JWT / OAuth2",
              sub: "RBAC",
              kind: "chip",
              anchor: { to: "api", side: "top" },
            },
          ],
        },
      ],
    },
    {
      id: "deploy",
      label: "deploy",
      tone: "dim",
      rows: [
        {
          id: "track",
          items: [
            { id: "push", label: "git push", kind: "build" },
            { id: "gha", label: "GitHub Actions", sub: "build / test", kind: "build" },
            { id: "artifact", label: "artifact", kind: "build" },
            { id: "ec2", label: "AWS EC2", sub: "deploy", kind: "build" },
          ],
        },
      ],
    },
  ],
  edges: [
    { id: "inbound-api", from: "inbound", to: "api" },
    // The gate draws into the edge before the API rather than floating above
    // it, which is the difference between "auth exists" and "auth is on this
    // path".
    { id: "auth-gate", from: "auth", to: { onEdge: "inbound-api", t: 0.62 }, kind: "aside" },
    { id: "api-sqs", from: "api", to: "sqs", label: { metric: "events/day" } },
    { id: "sqs-lambda", from: "sqs", to: "lambda" },
    { id: "lambda-whatsapp", from: "lambda", to: "whatsapp" },
    { id: "lambda-email", from: "lambda", to: "email", label: { metric: "onboarding effort" } },
    { id: "lambda-inapp", from: "lambda", to: "inapp", label: { metric: "feature rollout time" } },

    { id: "push-gha", from: "push", to: "gha", kind: "build" },
    { id: "gha-artifact", from: "gha", to: "artifact", kind: "build" },
    {
      id: "artifact-ec2",
      from: "artifact",
      to: "ec2",
      kind: "build",
      label: { metric: "release cycle" },
    },
    // EC2 is what the API runs on, so the track connects to the runtime lane
    // instead of ending in mid-air. Dimmed and headless: it is a relationship,
    // not a step.
    {
      id: "ec2-api",
      from: { node: "ec2", port: "t" },
      to: { node: "api", port: "b" },
      kind: "build",
      arrow: false,
    },
  ],
  // Index-aligned with the brynklabs bullets in site.ts.
  bulletNodes: ["inbound", "api", "sqs", "auth", "gha", "inapp"],
};
