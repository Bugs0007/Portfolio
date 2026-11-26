// Real content only, no lorem ipsum, no invented achievements.
// Unresolved facts are marked NEEDS and are also listed back to Bhagath in chat.

import travelOriginals from "./travel-originals.json";

export const person = {
  name: "Bhagath Samalla",
  tagline:
    "Sketchbook regular, mediocre guitarist, and a firm believer that there are infinite chances as long as you're still trying.",
  summary:
    "Python backend engineer with GenAI project experience. Seven months as a software development intern on Django and AWS for client projects, plus Case Intel, a live RAG platform for advocates, and a fine-tuned 1B model that reads court orders.",
  location: "Hyderabad, India",
  email: "samallabhagath@gmail.com",
  phone: "+91-6300187099",
  github: "https://github.com/Bugs0007",
  linkedin: "https://www.linkedin.com/in/bhagath-samalla/",
  instagram: "https://www.instagram.com/_bhagath_007/",
  // Mirrors the Technical Skills block of the current résumé PDF.
  stack: [
    "Python",
    "SQL",
    "Java",
    "C",
    "Django",
    "DRF",
    "FastAPI",
    "Flask",
    "REST APIs",
    "JWT",
    "OAuth2",
    "LLM APIs (OpenAI, Groq, Gemini, Ollama)",
    "RAG",
    "LangGraph",
    "MCP",
    "pgvector",
    "hybrid search",
    "HyDE",
    "RRF",
    "reranking",
    "QLoRA (Unsloth)",
    "GGUF",
    "spaCy",
    "PostgreSQL",
    "MySQL",
    "Redis",
    "SQLite",
    "AWS (EC2, RDS, S3, SQS, Lambda, EventBridge)",
    "Nginx",
    "Git",
    "GitHub Actions",
  ],
} as const;

// The in-page index (SectionNav), in page order. Each `id` is the element id
// that section already renders; each `label` is its heading, shortened where
// the heading is a phrase. The Seam between Work and Music is deliberately not
// here: it is a transition, not somewhere anyone wants to land.
//
// `side` says which half of the site a section lives in (see SideContext):
// "work" is the professional profile, "life" is Off the Clock, "both" shows in
// either. The index only lists the sections of the side being viewed.
export type Side = "work" | "life";

export const sides = {
  work: { label: "Work", eyebrow: "01 / The professional side", blurb: "Engineering · Case Intel · Résumé" },
  life: { label: "Off the Clock", eyebrow: "02 / The rest of the story", blurb: "Travel · Art · Music · The open road" },
} as const;

export const pageSections = [
  { id: "intro", label: "Intro", side: "both" },
  { id: "work", label: "Work", side: "work" },
  { id: "game", label: "Game", side: "work" },
  { id: "music", label: "Music", side: "life" },
  { id: "travel", label: "Travel", side: "life" },
  { id: "art", label: "Art", side: "life" },
  { id: "riding", label: "Riding", side: "life" },
  { id: "favorites", label: "Favorites", side: "life" },
  { id: "contact", label: "Contact", side: "both" },
] as const;

// Birth moment for the live age counter in the hero: 31 Dec 2004, about 7 PM IST.
export const birthMoment = "2004-12-31T19:00:00+05:30";

export const education = [
  {
    school: "Mahatma Gandhi Institute of Technology",
    shortSchool: "MGIT",
    location: "Hyderabad",
    degree: "B.Tech in Computer Science",
    years: "2022-2026",
    gradYear: "2026",
    detail: "CGPA 8.15/10",
  },
  {
    school: "Meluha International School",
    shortSchool: "Meluha International School",
    location: "Hyderabad",
    degree: "CBSE Class XII",
    years: "2020-2022",
    detail: "91.2%",
  },
] as const;

export const experience = [
  {
    company: "Brynklabs",
    href: "https://www.brynklabs.com/",
    role: "Software Development Intern",
    dates: "Aug 2025-Mar 2026",
    // Verbatim from the current résumé PDF.
    bullets: [
      "Built a ChatGPT App for Gathr, an event platform, on the Model Context Protocol (MCP) in about three weeks. I started with a FastAPI proof of concept, then moved it to a Next.js MCP server that shows an event carousel inside ChatGPT, so users find events and book tickets with QR codes in the chat.",
      "Built a config-driven notification service (Email, WhatsApp, In-App) on Django and AWS (SQS, Lambda, S3). It handled 1000+ events a day across client projects, and a new project onboards by adding database rows instead of writing notification code, which cut integration effort by about 90%.",
      "Added JWT/OAuth2 authentication with role-based access control, and set up GitHub Actions to deploy to EC2 (install, migrate, restart gunicorn, check services). A deploy that took hours by hand now runs in under 15 minutes.",
      "Designed database tables and wrote queries and migrations for Django client projects, and wrote technical documentation for the services I built so teammates could pick them up.",
      "Contributed to Truspace, a Vastu report generation system on AWS (Lambda, EventBridge, S3, EC2).",
      "Worked across several client projects, mostly in Django, took part in team code reviews, and helped ship a client release on a tight deadline: bug fixes, testing, deployment and app store publishing.",
    ],
    stack: [
      "MCP",
      "FastAPI",
      "Next.js",
      "Django",
      "AWS SQS",
      "Lambda",
      "AWS S3",
      "EventBridge",
      "AWS EC2",
      "JWT",
      "OAuth2",
      "RBAC",
      "GitHub Actions",
    ],
  },
] as const;

// A named link on a project card. Plural because Composite Sketch is two
// repos (frontend, backend) rather than one, so a single href/linkLabel pair
// (still used by CaseIntel, for its live site) can't express it.
export type ProjectLink = { href: string; label: string };

export type Project = {
  name: string;
  year?: string;
  href?: string;
  linkLabel?: string;
  links?: ProjectLink[];
  status?: string;
  // True for the projects on the current résumé PDF. The /resume page lists
  // only these; the site's Work section still shows the whole archive.
  onResume?: boolean;
  summary: string;
  decision: string;
  highlights?: string[];
  stack: string[];
};

export const projects: Project[] = [
  {
    name: "CaseIntel",
    year: "2026",
    href: "https://caseintel.in",
    linkLabel: "live at caseintel.in",
    onResume: true,
    summary:
      "A case management platform for practicing advocates, built for them and shaped by their feedback: it tracks cases live from eCourts, reads cause lists before each hearing, keeps orders with AI summaries, and handles invoicing.",
    decision:
      "Underneath: a Django REST API (about 115 routes and 49 models) on PostgreSQL with pgvector, an eCourts pipeline reverse-engineered end to end (session tokens, rotating headers, CAPTCHAs), and RAG in LangGraph with HyDE, hybrid search merged by Reciprocal Rank Fusion, and a cross-encoder reranker on onnxruntime.",
    highlights: [
      "The reranker moved to onnxruntime, cutting worker memory from about 430 MB to 116 MB. Answers come with citations, through a provider-agnostic LLM layer (Groq, OpenAI, Ollama, Gemini).",
      "Pulls 1000+ case records per run and parses court PDFs with OCR and coordinate rules. Jobs run on a Postgres queue; after two parallel searches took the server down, it was capped to one at a time.",
      "A practice-wide Case Bot answers across all cases from fixed read queries. It can only propose billing changes as cards the advocate confirms; it never sends or marks anything paid on its own.",
      "Next.js 15 frontend on Vercel, plus a LangGraph drafting flow that writes case documents from the advocate's own case data.",
      "Row-level multi-tenant isolation is enforced in views, serializers and AI retrieval, so each advocate only ever sees their own cases.",
    ],
    stack: [
      "Django",
      "DRF",
      "PostgreSQL",
      "pgvector",
      "LangGraph",
      "onnxruntime",
      "Next.js 15",
      "Vercel",
      "AWS EC2",
      "RDS",
      "Nginx",
      "gunicorn",
    ],
  },
  {
    name: "Court-Order Extractor",
    year: "2026",
    onResume: true,
    links: [{ href: "https://github.com/Bugs0007/Court-Order-Extractor", label: "GitHub" }],
    summary:
      "A fine-tuned small language model: Llama 3.2 1B with QLoRA (4-bit base, rank-16 adapters, Unsloth, free Colab T4) that turns Telangana High Court orders into structured JSON: case number, dates, outcome, party-wise directions and a summary.",
    decision:
      "About 400 public orders labelled with Gemini, split by case so no evaluation case is seen in training. On 78 held-out orders, valid JSON went from 17.9% to 98.7% and outcome accuracy from 14.1% to 92.3% (measured against the Gemini labels). Directions are the weak spot at 66.7 F1.",
    highlights: [
      "Metrics picked to match what the product shows instead of perplexity or ROUGE, and a 4-bit GGUF export (808 MB) for local Ollama.",
      "Built to sit behind Case Intel's AI layer, with the hosted model as fallback on invalid JSON. Rollout plan: shadow mode beside the hosted model first, compare outputs, then switch Telangana High Court orders over.",
    ],
    stack: ["Llama 3.2 1B", "QLoRA", "Unsloth", "Gemini labelling", "GGUF", "Ollama"],
  },
  {
    name: "Composite Sketch & Criminal Face Identification System",
    year: "2026",
    summary:
      "A forensic face-recognition platform: Django REST Framework and PostgreSQL pgvector doing similarity search across criminal profile datasets.",
    decision:
      "Faces are embedded with dlib's 128-D face embeddings and matched by vector similarity search; uploads, retrieval, and search all go through S3-backed REST APIs.",
    stack: ["Django REST Framework", "pgvector", "dlib", "AWS S3", "REST APIs"],
    links: [
      {
        href: "https://github.com/Bugs0007/Major-Project-Criminal-Forensics-Face-Match",
        label: "frontend",
      },
      {
        href: "https://github.com/Bugs0007/Major-Project-Criminal-Forensics",
        label: "backend",
      },
    ],
  },
  {
    name: "Automated Attendance Management System",
    year: "2024",
    summary:
      "A real-time face-recognition attendance system that cut manual attendance tracking effort by 90% during classroom operations.",
    decision:
      "Multithreaded frame processing brought recognition latency from 1.2s down to 0.8s (33% faster), and iterative testing plus dataset tuning pushed recognition accuracy from 85% to 92%. Ran on AWS EC2 at 99.9% uptime through a semester-long pilot with 30+ students.",
    stack: ["OpenCV", "Redis", "SQLite", "AWS EC2"],
    links: [{ href: "https://github.com/Bugs0007/attendance-system-app", label: "GitHub" }],
  },
  {
    name: "YouTube Shorts Automation Pipeline",
    summary:
      "An end-to-end pipeline that scripts, voices, animates, and uploads short-form video without a human in the loop.",
    decision:
      "Groq writes the script, edge-tts voices it, ComfyUI drives Ken Burns motion over still frames, then it's a straight shot through the YouTube Data API to publish.",
    stack: ["Groq", "edge-tts", "ComfyUI", "YouTube Data API v3"],
    links: [{ href: "https://github.com/Bugs0007/YT-Channel-Automation", label: "GitHub" }],
  },
];

export type ShowcasePanel = {
  number: string;
  label: string;
  headline: string;
  rows: { primary: string; secondary: string; status: string }[];
  stat: { label: string; value: string };
};

// Real copy and data straight off caseintel.in's own public marketing page,
// which already builds these as plain HTML panels rather than screenshots.
// Rebuilt here in the site's own tokens instead of an embedded screenshot.
export const caseIntelShowcase: ShowcasePanel[] = [
  {
    number: "01",
    label: "Find",
    headline: "Search the state, not one court at a time.",
    rows: [
      {
        primary: "WP/14882/2025",
        secondary: "High Court, Telangana",
        status: "match",
      },
      {
        primary: "CC/331/2024",
        secondary: "Hyderabad, CMM Court",
        status: "match",
      },
    ],
    stat: { label: "Districts scanned", value: "33 / 33" },
  },
  {
    number: "02",
    label: "Appear",
    headline: "Tomorrow's board, the evening before.",
    rows: [
      {
        primary: "WP/14882/2025",
        secondary: "Court No. 4, Division Bench",
        status: "item 27",
      },
      {
        primary: "CRP/887/2025",
        secondary: "Court No. 12, Single Judge",
        status: "item 6",
      },
    ],
    stat: { label: "List types read", value: "8 / 8" },
  },
  {
    number: "03",
    label: "Record",
    headline: "The order lands on the hearing that produced it.",
    rows: [
      {
        primary: "order_3_2025-09-14.pdf",
        secondary: "WP/14882/2025, 2 pages",
        status: "attached",
      },
      {
        primary: "order_5_2025-11-21.pdf",
        secondary: "CRP/887/2025, 4 pages",
        status: "attached",
      },
    ],
    stat: { label: "Next hearing", value: "08 Jan 2027" },
  },
  {
    number: "04",
    label: "Bill",
    headline: "Every appearance ends as a number you can send.",
    rows: [
      { primary: "CI/2026/0114", secondary: "21 Nov 2025", status: "paid" },
      { primary: "CI/2026/0098", secondary: "14 Aug 2025", status: "invoiced" },
    ],
    stat: { label: "Fees", value: "up to date" },
  },
];

// --- Work rig data model ---------------------------------------------------
//
// The Work section has a multi-mode display rig (src/components/work), the same
// shape as Travel's. Every mode reads this one structure, so no mode has to
// re-parse a metric back out of a prose sentence.
//
// This is additive: `experience`, `projects` and `caseIntelShowcase` above are
// untouched and are still what the classic mode renders. `bullets` here are
// those same sentences verbatim, and `metrics` are extracted *alongside* them,
// never instead of them. Nothing here is a new claim: every number below is
// already stated in the prose it was lifted from.

export type WorkMetric = {
  label: string; // "events/day"
  value: string; // "1,000+"
  from?: string; // "1.2s"  (for before/after pairs)
  to?: string; // "0.8s"
  note?: string;
};

export type WorkItem = {
  id: string;
  kind: "role" | "project";
  title: string;
  org?: string;
  subtitle?: string;
  when: string;
  href?: string;
  // The composite-sketch project is two repos (frontend, backend), so it
  // can't be said with the single href above. When links is set, it's
  // rendered instead of href, never alongside it.
  links?: ProjectLink[];
  // Only brynklabs and caseintel. The heavier modes (tube, pipeline, product)
  // give a full pinned treatment to featured items and fall back to a compact
  // classic card for everything else, so this flag is what stops five projects
  // from turning the section into thirty viewport-heights of scroll.
  featured: boolean;
  summary: string;
  bullets: string[];
  metrics: WorkMetric[];
  stack: string[];
  // NEEDS: no work item has media yet. Tube mode wants real screenshots (see
  // src/components/work/modes/TubeMode.tsx for the exact format) and renders a
  // text tube until they exist. Nothing is generated to fill the gap.
  media?: { src: string; width: number; height: number; alt: string }[];
};

const projectNamed = (name: string) => projects.find((p) => p.name === name)!;
const caseIntelProject = projectNamed("CaseIntel");
const courtOrderProject = projectNamed("Court-Order Extractor");
const compositeProject = projectNamed("Composite Sketch & Criminal Face Identification System");
const attendanceProject = projectNamed("Automated Attendance Management System");
const shortsProject = projectNamed("YouTube Shorts Automation Pipeline");

export const workItems: WorkItem[] = [
  {
    id: "brynklabs",
    kind: "role",
    title: "Brynklabs",
    org: "Brynklabs",
    subtitle: "Software Development Intern",
    when: "Aug 2025-Mar 2026",
    href: "https://www.brynklabs.com/",
    featured: true,
    // Derived from the bullets below, not a new claim: every noun in it appears
    // in one of them.
    summary:
      "Backend and platform work on Django and AWS for client projects: a ChatGPT app on MCP, a config-driven notification service, auth and RBAC, CI/CD, and Truspace.",
    bullets: [...experience[0].bullets],
    metrics: [
      {
        label: "events/day",
        value: "1,000+",
        note: "multi-channel notification system",
      },
      { label: "integration effort", value: "about -90%", note: "new projects onboard by adding rows" },
      { label: "ChatGPT app on MCP", value: "about 3 weeks" },
      { label: "deploy time", value: "under 15 min", from: "hours", to: "under 15 min" },
    ],
    stack: [...experience[0].stack],
  },
  {
    id: "caseintel",
    kind: "project",
    title: "CaseIntel",
    when: "2026",
    href: "https://caseintel.in",
    featured: true,
    summary: caseIntelProject.summary,
    bullets: [caseIntelProject.decision, ...(caseIntelProject.highlights ?? [])],
    // Every number here is stated on the résumé or in the showcase panels.
    metrics: [
      { label: "API routes", value: "115" },
      { label: "data models", value: "49" },
      { label: "reranker memory", value: "116 MB", from: "430 MB", to: "116 MB" },
      { label: "districts scanned", value: "33 / 33" },
      { label: "list types read", value: "8 / 8" },
    ],
    // Extends projects[0].stack rather than editing it, so the classic project
    // card is unchanged. These are the terms from the architecture that are
    // real parts of the stack but have no step of their own in the flow, and
    // the density rule says a term without a place in a flow belongs in the
    // tags rather than in a box.
    stack: [
      ...caseIntelProject.stack,
      "spaCy",
      "HyDE",
      "RRF",
      "cross-encoder",
      "tsvector",
      "pdfminer",
      "fpdf2",
    ],
  },
  {
    id: "court-order-extractor",
    kind: "project",
    title: "Court-Order Extractor",
    when: "2026",
    featured: false,
    summary: courtOrderProject.summary,
    bullets: [courtOrderProject.decision, ...(courtOrderProject.highlights ?? [])],
    links: courtOrderProject.links,
    metrics: [
      { label: "valid JSON", value: "98.7%", from: "17.9%", to: "98.7%", note: "78 held-out orders" },
      { label: "outcome accuracy", value: "92.3%", from: "14.1%", to: "92.3%", note: "against Gemini labels" },
      { label: "directions F1", value: "66.7", note: "the weak spot" },
      { label: "GGUF export", value: "808 MB", note: "4-bit, local Ollama" },
    ],
    stack: [...courtOrderProject.stack],
  },
  {
    id: "composite-sketch",
    kind: "project",
    title: "Composite Sketch & Criminal Face Identification System",
    when: "2026",
    featured: false,
    summary: compositeProject.summary,
    bullets: [compositeProject.decision],
    metrics: [{ label: "face embedding", value: "128-D", note: "dlib" }],
    stack: [...compositeProject.stack],
    links: compositeProject.links,
  },
  {
    id: "attendance",
    kind: "project",
    title: "Automated Attendance Management System",
    when: "2024",
    featured: false,
    summary: attendanceProject.summary,
    bullets: [attendanceProject.decision],
    links: attendanceProject.links,
    metrics: [
      { label: "manual effort", value: "-90%" },
      {
        label: "recognition latency",
        value: "0.8s",
        from: "1.2s",
        to: "0.8s",
        note: "33% faster, multithreaded frames",
      },
      { label: "recognition accuracy", value: "92%", from: "85%", to: "92%" },
      { label: "uptime", value: "99.9%", note: "AWS EC2, semester-long pilot" },
      { label: "students", value: "30+" },
    ],
    stack: [...attendanceProject.stack],
  },
  {
    id: "youtube-shorts",
    kind: "project",
    title: "YouTube Shorts Automation Pipeline",
    when: "",
    featured: false,
    summary: shortsProject.summary,
    bullets: [shortsProject.decision],
    metrics: [],
    stack: [...shortsProject.stack],
    links: shortsProject.links,
  },
];

export const featuredWorkItems = workItems.filter((item) => item.featured);
export const supportingWorkItems = workItems.filter((item) => !item.featured);

export const music = {
  intro: "Learning flute and guitar.",
  media: {
      poster: "/media/music/poster.jpg",
      loop: "/media/music/loop.mp4",
      width: 1920,
      height: 800,
  },
} as const;

export type JourneyMedia = {
  kind: "image" | "video";
  src: string;
  // videos carry a poster frame so nothing waits on the video to paint
  poster?: string;
  sources?: { src: string; type: string }[];
  durationSeconds?: number;
  width: number;
  height: number;
  alt: string;
  caption: string;
  // Present only where the original file actually carried GPS EXIF. Deliberately
  // absent elsewhere rather than filled with a place-level lookup, so a
  // coordinate on screen always means a real one read off the photo.
  coords?: { lat: number; lon: number };
};

export type Journey = {
  id: string;
  title: string;
  region: string;
  when: string;
  media: JourneyMedia[];
};

// Grouped by actual trip, not by individual stop. Dates and the coordinates
// below come from EXIF read off the originals with exifr, so the Zanskar run
// really is one trip (31 May to 7 June) and the Manali snow photos really are a
// separate January one. Ooty and Haridwar are left out for now, no photo Bhagath
// was happy with, easy to add back later.
const journeyCatalog: Journey[] = [
  {
    id: "zanskar",
    title: "Zanskar",
    region: "Ladakh",
    when: "June 2026",
    media: [
      {
        kind: "video",
        src: "/media/travel/zanskar-truck-ride.mp4",
        poster: "/media/travel/zanskar-truck-ride.jpg",
        width: 1600,
        height: 900,
        alt: "Bhagath and a friend riding on the roof rack of a truck, watching the open Zanskar valley road pass beneath snow-capped peaks.",
        caption: "The road in",
      },
      {
        kind: "image",
        src: "/media/travel/sethan-forest.jpg",
        width: 1650,
        height: 2200,
        alt: "Bhagath walking down a forest trail beneath tall pines near Sethan, Himachal Pradesh.",
        caption: "Sethan",
        coords: { lat: 32.2395, lon: 77.226 },
      },
      {
        kind: "video",
        src: "/media/travel/zanskar-river-wash.mp4",
        poster: "/media/travel/zanskar-river-wash.jpg",
        width: 1600,
        height: 900,
        alt: "Bhagath lying across river rocks to wash his face in glacial meltwater, a monastery visible on the ridge above.",
        caption: "Cooling off",
      },
      {
        kind: "image",
        src: "/media/travel/gonbo-rangjon.jpg",
        width: 2200,
        height: 1238,
        alt: "Bhagath facing a fog-wrapped rock spire, Gonbo Rangjon, on the road into Zanskar.",
        caption: "Gonbo Rangjon",
        coords: { lat: 32.9769, lon: 77.2514 },
      },
      {
        kind: "image",
        src: "/media/travel/zanskar-cliffside.jpg",
        width: 2200,
        height: 1650,
        alt: "Bhagath standing on a boulder beneath a mist-wrapped granite cliff face lined with pines.",
        caption: "Zanskar",
      },
      {
        kind: "image",
        src: "/media/travel/pensi-la.jpg",
        width: 2200,
        height: 1237,
        alt: "Bhagath seated on a rock at Pensi La, snow-capped Himalayan peaks visible behind him.",
        caption: "Pensi La",
      },
      {
        kind: "video",
        src: "/media/travel/zanskar-glacier.mp4",
        poster: "/media/travel/zanskar-glacier.jpg",
        width: 1920,
        height: 1080,
        alt: "Bhagath sitting on a boulder overlooking a glacier winding down between snow peaks into a milky lake.",
        caption: "Above the glacier",
      },
      {
        kind: "video",
        src: "/media/travel/zanskar-frozen-lake.mp4",
        poster: "/media/travel/zanskar-frozen-lake.jpg",
        width: 1920,
        height: 1080,
        alt: "Bhagath walking along the edge of a half-frozen turquoise lake, snow-capped peaks on both sides.",
        caption: "Zanskar",
      },
      {
        kind: "image",
        src: "/media/travel/zanskar-dog.jpg",
        width: 2200,
        height: 1238,
        alt: "Bhagath crouching to pet a golden-haired stray dog at a roadside market stall in Zanskar, Ladakh.",
        caption: "Zanskar Valley",
        coords: { lat: 33.4691, lon: 76.8796 },
      },
      {
        kind: "video",
        src: "/media/travel/zanskar-local-child.mp4",
        poster: "/media/travel/zanskar-local-child.jpg",
        width: 1920,
        height: 1080,
        alt: "A local child in a knit beanie leaning on a wooden railing, glancing at the camera.",
        caption: "Zanskar",
      },
      {
        kind: "image",
        src: "/media/travel/zanskar-baby.jpg",
        width: 2200,
        height: 1017,
        alt: "Bhagath holding a sleeping local baby indoors in Zanskar, Ladakh.",
        caption: "Zanskar Valley",
      },
      {
        kind: "video",
        src: "/media/travel/zanskar-monks.mp4",
        poster: "/media/travel/zanskar-monks.jpg",
        width: 1920,
        height: 1080,
        alt: "Bhagath and a friend talking with monks in red robes outside a monastery, snow peaks rising behind them.",
        caption: "Zanskar, monastery",
      },
      {
        kind: "image",
        src: "/media/travel/zanskar-monastery-tea.jpg",
        width: 2200,
        height: 1017,
        alt: "Bhagath drinking tea on a monastery wall overlooking a valley in Zanskar, Ladakh.",
        caption: "Zanskar, monastery",
      },
      {
        kind: "image",
        src: "/media/travel/jispa-stargazing.jpg",
        width: 2200,
        height: 1650,
        alt: "Bhagath standing beneath a dense, star-filled night sky at Jispa, silhouetted against a mountain ridge.",
        caption: "Jispa",
        coords: { lat: 32.6011, lon: 77.1451 },
      },
      {
        kind: "video",
        src: "/media/travel/zangla-palace.mp4",
        poster: "/media/travel/zangla-palace.jpg",
        width: 1920,
        height: 1080,
        alt: "Bhagath sitting on a stone wall by the ruins of Zangla Palace, Himalayan peaks in the background.",
        caption: "Zangla Palace",
      },
    ],
  },
  {
    id: "manali-winter",
    title: "Manali",
    region: "Himachal Pradesh",
    when: "January 2026",
    media: [
      {
        kind: "video",
        src: "/media/travel/manali-village.mp4",
        poster: "/media/travel/manali-village.jpg",
        width: 1080,
        height: 1920,
        alt: "A view over Manali's wood and tin rooftops toward snow-lit peaks in the distance.",
        caption: "Manali",
      },
      {
        kind: "image",
        src: "/media/travel/manali-hidimba.jpg",
        width: 2200,
        height: 1650,
        alt: "Bhagath and friends posing in front of the wooden pagoda-roofed Hidimba Devi Temple, surrounded by tall cedars.",
        caption: "Hidimba Temple",
        coords: { lat: 32.2479, lon: 77.1807 },
      },
      {
        kind: "image",
        src: "/media/travel/koksar-group.jpg",
        width: 2200,
        height: 1650,
        alt: "Bhagath and eight friends sitting together on a snowy mountainside near Koksar.",
        caption: "Koksar",
        coords: { lat: 32.4076, lon: 77.2426 },
      },
      {
        kind: "video",
        src: "/media/travel/manali-forest.mp4",
        poster: "/media/travel/manali-forest.jpg",
        width: 1600,
        height: 900,
        alt: "Sunlight filtering through tall pines along a forest trail beside a mountain stream near Manali.",
        caption: "Manali",
      },
      {
        kind: "video",
        src: "/media/travel/manali-dog.mp4",
        poster: "/media/travel/manali-dog.jpg",
        width: 1920,
        height: 1080,
        alt: "A shaggy street dog resting on a stone path outside a guesthouse in Manali.",
        caption: "Manali",
      },
      {
        kind: "image",
        src: "/media/travel/manali-portrait.jpg",
        width: 2200,
        height: 1237,
        alt: "Bhagath bundled in a jacket against the cold, snow-capped peaks behind him.",
        caption: "Manali",
      },
      {
        kind: "video",
        src: "/media/travel/manali-paragliding.mp4",
        poster: "/media/travel/manali-paragliding.jpg",
        width: 1920,
        height: 1080,
        alt: "Bhagath paragliding in tandem at sunset near Manali, silhouetted against an orange sky.",
        caption: "Solang Valley",
      },
      {
        kind: "video",
        src: "/media/travel/manali-mall-road.mp4",
        poster: "/media/travel/manali-mall-road.jpg",
        width: 1920,
        height: 1080,
        alt: "Manali's Mall Road at night, strung with paper lanterns and bunting over a crowded market street.",
        caption: "Mall Road",
      },
    ],
  },
  {
    id: "coimbatore",
    title: "Coimbatore",
    region: "Tamil Nadu",
    when: "2025",
    media: [
      {
        kind: "image",
        src: "/media/travel/coimbatore-ridge.jpg",
        width: 1237,
        height: 2200,
        alt: "Bhagath standing at the edge of a grassy ridge in Kemmangundi, hazy blue hills receding into the distance.",
        caption: "Kemmangundi",
      },
      {
        kind: "image",
        src: "/media/travel/coimbatore-trek.jpg",
        width: 1650,
        height: 2200,
        alt: "Bhagath standing in windswept grass on a hilltop during the Kenmangudi trek near Coimbatore.",
        caption: "Kenmangudi",
      },
      {
        kind: "image",
        src: "/media/travel/coimbatore-valley.jpg",
        width: 1650,
        height: 2200,
        alt: "Bhagath sitting on a grassy ledge looking out over a hazy valley in the Western Ghats.",
        caption: "Kemmangundi",
      },
      {
        kind: "image",
        src: "/media/travel/coimbatore-friends-peak.jpg",
        width: 2200,
        height: 1650,
        alt: "Bhagath and seven friends posed together on a misty hilltop after the Kemmangundi trek.",
        caption: "Kemmangundi",
        coords: { lat: 13.3908, lon: 75.7212 },
      },
      {
        kind: "image",
        src: "/media/travel/coimbatore-friends-grass.jpg",
        width: 720,
        height: 1280,
        alt: "Bhagath and friends lounging in a grassy clearing, forested hills behind them.",
        caption: "Coimbatore",
      },
      {
        kind: "video",
        src: "/media/travel/coimbatore-sunset.mp4",
        poster: "/media/travel/coimbatore-sunset.jpg",
        width: 1920,
        height: 1080,
        alt: "Bhagath and friends watching the sunset from a grassy hillside near Coimbatore.",
        caption: "Coimbatore",
      },
      {
        kind: "video",
        src: "/media/travel/coimbatore-sunset-group.mp4",
        poster: "/media/travel/coimbatore-sunset-group.jpg",
        width: 1920,
        height: 1080,
        alt: "Bhagath and friends sitting in a row watching the sun set over the sea near Coimbatore.",
        caption: "Coimbatore, sunset",
      },
      {
        kind: "image",
        src: "/media/travel/coimbatore-sunset-silhouette.jpg",
        width: 1237,
        height: 2200,
        alt: "Bhagath silhouetted against the setting sun over the sea, checking his camera.",
        caption: "Coimbatore, sunset",
      },
    ],
  },
  {
    id: "uttarakhand",
    title: "Uttarakhand",
    region: "Kedarnath, Badrinath, Mana",
    when: "May 2024",
    media: [
      {
        kind: "image",
        src: "/media/travel/kedarnath-horse-ride.jpg",
        width: 1650,
        height: 2200,
        alt: "Bhagath with arms outstretched on a horse trek toward Kedarnath, clouds rolling over the trail.",
        caption: "On the way to Kedarnath",
      },
      {
        kind: "image",
        src: "/media/travel/kedarnath-temple.jpg",
        width: 1238,
        height: 2200,
        alt: "Kedarnath temple crowded with pilgrims, snow-capped peaks rising directly behind it.",
        caption: "Kedarnath",
      },
      {
        kind: "image",
        src: "/media/travel/badrinath.jpg",
        width: 2200,
        height: 1237,
        alt: "Badrinath temple complex with prayer flags, seen from above against a forested hillside.",
        caption: "Badrinath",
      },
      {
        kind: "image",
        src: "/media/travel/mana-village.jpg",
        width: 1237,
        height: 2200,
        alt: "Bhagath sitting on a rock near Mana Village as clouds roll in over the mountains.",
        caption: "Mana Village",
      },
    ],
  },
];

type NativeTravelMedia = Pick<JourneyMedia, "src" | "width" | "height"> & Partial<Pick<JourneyMedia, "poster" | "sources" | "durationSeconds">>;
const nativeTravelMedia: Record<string, NativeTravelMedia> = travelOriginals;

// Captions and trip ordering stay curated here; the verified native masters
// supply their real dimensions, lossless photos and original video streams.
export const journeys: Journey[] = journeyCatalog.map((journey) => ({
  ...journey,
  media: journey.media.map((media) => {
    const base = media.src.split("/").pop()!.replace(/\.[^.]+$/, "");
    return { ...media, ...nativeTravelMedia[base] };
  }),
}));

export type ArtPiece = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  medium: "painting" | "sketch";
};

export const art = {
  note: "Paint and sketch when I get the chance.",
  // Was `paintings`, now `pieces`: the section holds both mediums, and the old
  // name would have been a lie the moment the sketchbook went in.
  pieces: [
    {
      src: "/media/art/elephant.jpg",
      width: 1204,
      height: 1821,
      alt: "Acrylic painting by Bhagath of an elephant's face in warm oranges and yellows.",
      caption: "Elephant",
      medium: "painting",
    },
    {
      src: "/media/art/ganesh.jpg",
      width: 1539,
      height: 1818,
      alt: "Acrylic painting by Bhagath of Ganesh in warm reds and golds.",
      caption: "Ganesh",
      medium: "painting",
    },
    {
      src: "/media/art/tiger.jpg",
      width: 923,
      height: 1389,
      alt: "Acrylic painting by Bhagath of a tiger wading through blue water.",
      caption: "Tiger",
      medium: "painting",
    },
    {
      src: "/media/art/mountain-sunset.jpg",
      width: 1200,
      height: 1600,
      alt: "Acrylic painting by Bhagath of a snow-capped peak lit gold and orange under a pink sky, with a low orange sun, a pink lake and pine-covered green slopes below.",
      caption: "Mountain sunset",
      medium: "painting",
    },
    {
      src: "/media/art/sketch-eye.jpg",
      width: 1500,
      height: 1934,
      alt: "Pencil study by Bhagath of a single eye, close up, with detailed lashes and a highlight on the iris.",
      caption: "Eye study",
      medium: "sketch",
    },
    {
      src: "/media/art/sketch-rain-traveller.jpg",
      width: 1500,
      height: 1774,
      alt: "Pencil sketch by Bhagath of a figure in a wide straw hat and long coat walking through heavy rain.",
      caption: "Rain",
      medium: "sketch",
    },
    {
      src: "/media/art/sketch-portrait-suit.jpg",
      width: 1500,
      height: 1710,
      alt: "Charcoal portrait by Bhagath of a man in a suit and tie, face half in shadow.",
      caption: "Portrait",
      medium: "sketch",
    },
    {
      src: "/media/art/sketch-hanuman.jpg",
      width: 1500,
      height: 2056,
      alt: "Pencil sketch by Bhagath of Hanuman wearing a crown, drawn in fine line work.",
      caption: "Hanuman",
      medium: "sketch",
    },
    {
      src: "/media/art/sketch-hat-figure.jpg",
      width: 1500,
      height: 2126,
      alt: "Pen sketch by Bhagath of a standing figure in a wide-brimmed hat, one arm raised to the brim.",
      caption: "Standing figure",
      medium: "sketch",
    },
    {
      src: "/media/art/sketch-anime-figure.jpg",
      width: 1400,
      height: 2192,
      alt: "Pen sketch by Bhagath of an anime-style character with spiked hair, captioned in Japanese.",
      caption: "Tenjou tenge",
      medium: "sketch",
    },
  ] satisfies ArtPiece[] as ArtPiece[],
};

export type RidingMedia = {
  kind: "image" | "video";
  src: string;
  poster?: string;
  width: number;
  height: number;
  alt: string;
};

export const riding = {
  bike: null as string | null, // NEEDS: make/model. A few bikes show up in photos, unconfirmed which is his
  namedRides: [
    {
      name: "Parigi",
      note: "Windmills and backroads out past Vikarabad, ridden with friends.",
    },
  ],
  hero: {
    src: "/media/riding/three-bikes-windmill.jpg",
    width: 2400,
    height: 1800,
    alt: "Three motorcycles parked in a field with wind turbines behind them, Parigi.",
  },
    photos: [
      {
        kind: "image",
        src: "/media/riding/city-rider-original.jpg",
        width: 960,
        height: 1280,
        alt: "Bhagath wearing a helmet while seated on a motorcycle on a tree-lined city street.",
      },
      {
        kind: "image",
        src: "/media/riding/bikes-in-the-shade-original.jpg",
        width: 1280,
        height: 960,
        alt: "Three motorcycles parked together on grass beneath leafy trees.",
      },
      {
        kind: "video",
        src: "/media/riding/riding-moment-original.mp4",
        poster: "/media/riding/riding-moment-poster-original.png",
        width: 464,
        height: 832,
        alt: "Bhagath riding a red motorcycle along an urban flyover, filmed from a nearby vehicle.",
      },
    {
      kind: "image",
      src: "/media/riding/yellow-grass-bike.jpg",
      width: 2400,
      height: 1350,
      alt: "Bhagath riding a motorcycle across a dry grass field with wind turbines in the distance, Parigi.",
    },
    {
      kind: "image",
      src: "/media/riding/three-bikes-parigi.jpg",
      width: 2400,
      height: 1109,
      alt: "A rider approaching three parked motorcycles at dusk, wind turbines on the horizon, Parigi.",
    },
    {
      kind: "image",
      src: "/media/riding/helmet-night.jpg",
      width: 2400,
      height: 1109,
      alt: "Bhagath wearing a Batman-branded helmet on a motorcycle at night.",
    },
    {
      kind: "image",
      src: "/media/riding/parigi-sunrise.jpg",
      width: 2400,
      height: 1800,
      alt: "Sunrise over open fields near Parigi.",
    },
    {
      kind: "video",
      src: "/media/riding/visor-loop.mp4",
      poster: "/media/riding/visor-poster.jpg",
      width: 1920,
      height: 1080,
      alt: "POV shot of a motorcycle visor closing while riding.",
    },
  ] satisfies RidingMedia[],
};

// The game is something I built, so it sits right under Work, ahead of the
// "Life beyond work" Seam, rather than with the hobbies.
  // Use the full-resolution source and its original frame rate.
export const game = {
  name: "Brawlkai",
  url: "https://supa-figh.vercel.app",
  blurb:
    "A 2D pixel fighter with anime characters. I built it, and it runs right in your browser.",
  // Controls are keyboard (WASD and arrows) or gamepad. It has no touch input.
  controlsHint: "It needs a keyboard, so it plays best on desktop.",
  trailer: {
      poster: "/media/game/poster.jpg",
      mp4: "/media/game/trailer.mp4",
    webm: "/media/game/trailer.webm",
      width: 1920,
      height: 1080,
    alt: "Brawlkai trailer: a pixel-art Super Saiyan fires a beam across a night-sky arena at a dark red orb.",
  },
} as const;

// My Favorites (anime/movie/show list) has grown enough fields (YouTube
// config, captions) to outgrow this file: see src/content/watching.ts.

// Two learning platforms built after CaseIntel, shown right under it in Work
// (src/components/LearningPlatforms.tsx). Screenshots are real captures from
// each app's own Playwright run, converted to WebP, in public/media/projects.
// Every number below comes from the project's own docs or code: 274 concepts
// and 11 panel types from Tracewise's PROGRESS.md and COVERAGE.md; the mission
// count is the number of packs in NINES's src/content/packs, and the review
// formats come from its ROADMAP.
export type PlatformShot = {
  src: string;
  width: number;
  height: number;
  alt: string;
  // Short label for the thumbnail, and the line under the stage.
  label: string;
  caption: string;
};

export type LearningPlatform = {
  id: string;
  name: string;
  tagline: string;
  kind: string;
  when: string;
  pitch: string;
  points: string[];
  stats: { value: string; label: string }[];
  stack: string[];
  links: ProjectLink[];
  shots: PlatformShot[];
};

export const learningPlatformsIntro =
  "Two more things I built, both aimed at learning by doing instead of reading.";

export const learningPlatforms: LearningPlatform[] = [
  {
    id: "tracewise",
    name: "Tracewise",
    tagline: "Watch it. Predict it. Type it yourself.",
    kind: "Interview prep console",
    when: "2026",
    pitch:
      "An interview-prep console for engineers who have leaned on AI tools and want their hands back on the keyboard. Each concept is a step-through of real code, then a typing ladder takes the scaffolding away until you can write it from a blank page.",
    points: [
      "Visualizers driven by real execution: arrays, trees, graphs, DP tables with dependency arrows, call trees. Predict mode asks you to guess each next step before it plays.",
      "Python runs in WebAssembly (Pyodide), JavaScript in a worker, React in a sandboxed iframe. No backend, and it works offline.",
      "Practice modes include spaced-repetition review, a timed no-hint Interview Mode with a score report, a Syntax Gym, and a capstone you build over an in-browser mock network.",
      "A content validator runs every lesson's solution, buggy code and visualizer against real Python, Node and jsdom, so nothing ships unverified.",
    ],
    stats: [
      { value: "274", label: "concepts" },
      { value: "6", label: "modules" },
      { value: "11", label: "visualizer panels" },
    ],
    stack: [
      "React",
      "TypeScript",
      "Vite",
      "Pyodide",
      "WebAssembly",
      "CodeMirror",
      "Zustand",
      "Supabase",
      "Playwright",
      "Vitest",
    ],
    links: [
      { href: "https://tracewise-blue.vercel.app/", label: "Live site" },
      { href: "https://github.com/Bugs0007/tracewise", label: "GitHub" },
    ],
    shots: [
      {
        src: "/media/projects/tracewise-home.webp",
        width: 1400,
        height: 900,
        alt: "Tracewise home page with a binary search visualizer next to its code, and six learning modules listed below.",
        label: "Home",
        caption: "Home: a live binary search beside its code, then six modules and 274 concepts.",
      },
      {
        src: "/media/projects/tracewise-dijkstra.webp",
        width: 1400,
        height: 900,
        alt: "Tracewise visualizer stepping through Dijkstra's algorithm on a weighted graph, with the code, a heap and a distance table.",
        label: "Graphs",
        caption: "Dijkstra stepping through a real run, with the heap and distance table updating live.",
      },
      {
        src: "/media/projects/tracewise-dp.webp",
        width: 1400,
        height: 900,
        alt: "Tracewise visualizer showing a longest common subsequence DP table with a dependency arrow and a scrubbable timeline.",
        label: "DP",
        caption: "Longest common subsequence: a DP table with dependency arrows and a scrubbable timeline.",
      },
    ],
  },
  {
    id: "nines",
    name: "NINES",
    tagline: "Learn system design by breaking systems.",
    kind: "System design and AI engineering game",
    when: "2026",
    pitch:
      "A game that teaches system design, AI engineering and dev fundamentals by letting you run the systems. You are the first backend engineer at a made-up chat app. You predict what will happen, then a real simulation shows you.",
    points: [
      "Every mission follows the same loop: predict with a confidence rating, play with live sliders, see the reveal, then explain it back. Bosses and a live incident room test it under pressure.",
      "The engine is a deterministic discrete-event simulation in a Web Worker, checked against queueing theory (M/M/1, M/M/c, Little's Law) so the behavior is earned, not scripted.",
      "Spaced repetition (FSRS) schedules reviews across seven card formats. An optional AI coach grades explanations and gives hints, and every feature still works with it off.",
      "Guests play offline in the browser. Signing in syncs progress through Supabase, with server-side validation and your own AI key never touching the server.",
    ],
    stats: [
      { value: "10", label: "missions and bosses" },
      { value: "7", label: "review formats" },
      { value: "2", label: "learning tracks" },
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind",
      "Web Workers",
      "Canvas 2D",
      "Dexie",
      "ts-fsrs",
      "Supabase",
      "Groq",
      "Playwright",
      "Vitest",
    ],
    links: [
      { href: "https://nines-neon.vercel.app/", label: "Live site" },
      { href: "https://github.com/Bugs0007/NINES", label: "GitHub" },
    ],
    shots: [
      {
        src: "/media/projects/nines-hq.webp",
        width: 1440,
        height: 900,
        alt: "NINES HQ screen showing an uptime readout in nines, a daily shift card, and a map of infrastructure tracks.",
        label: "HQ",
        caption: "HQ: your uptime counted in nines, the daily shift, and a map of what you have built.",
      },
      {
        src: "/media/projects/nines-launch-day.webp",
        width: 1440,
        height: 900,
        alt: "NINES Launch Day boss fight with a live fleet simulation, a launch plan with sliders, and the challenge brief.",
        label: "Boss fight",
        caption: "Launch Day: size a fleet, pick a load balancer, then survive the traffic spike.",
      },
      {
        src: "/media/projects/nines-incident.webp",
        width: 1440,
        height: 900,
        alt: "NINES incident room with dashboards, a target health table, a service map, an evidence board and a list of actions.",
        label: "Incident",
        caption: "Incident room: read dashboards and logs, pin evidence, form a theory, then act.",
      },
      {
        src: "/media/projects/nines-the-bill.webp",
        width: 1440,
        height: 900,
        alt: "NINES The Bill challenge with a context window stack, policy controls, a token chart and a forecast prompt.",
        label: "AI cost",
        caption: "The Bill: shape the context policy and forecast the monthly cost before you ship.",
      },
    ],
  },
];
