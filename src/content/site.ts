// Real content only, no lorem ipsum, no invented achievements.
// Unresolved facts are marked NEEDS and are also listed back to Bhagath in chat.

export const person = {
  name: "Bhagath Samalla",
  tagline:
    "Sketchbook regular, mediocre guitarist, and a firm believer that there are infinite chances as long as you're still trying.",
  summary:
    "Software developer focused on backend engineering, cloud-native deployment, and applied AI systems: LangGraph reasoning pipelines and production Django/AWS platforms with real users.",
  location: "Hyderabad, India",
  email: "samallabhagath@gmail.com",
  phone: "+91-6300187099",
  github: "https://github.com/Bugs0007",
  linkedin: "https://www.linkedin.com/in/bhagath-samalla-301282281/",
  instagram: "https://www.instagram.com/_bhagath_007/",
  stack: [
    "Python",
    "Java",
    "JavaScript",
    "C",
    "SQL",
    "Django",
    "DRF",
    "Flask",
    "REST APIs",
    "JWT",
    "OAuth2",
    "RBAC",
    "microservices",
    "PostgreSQL",
    "MySQL",
    "SQLite",
    "Redis",
    "pgvector",
    "AWS",
    "GitHub Actions",
    "LangGraph",
    "MCP",
    "RAG",
    "HyDE",
    "OpenCV",
    "dlib",
  ],
} as const;

export const education = [
  {
    school: "Mahatma Gandhi Institute of Technology",
    shortSchool: "MGIT",
    location: "Hyderabad",
    degree: "B.Tech in Computer Science",
    years: "2022-2026",
    gradYear: "2026",
    detail: "CGPA 8.15/10, no backlogs",
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
    bullets: [
      "MCP integration for Gathr, letting people discover events, book tickets, and pull QR codes entirely inside a ChatGPT conversation, the same in-chat pattern Figma and Booking.com use.",
      "Multi-channel notification system (email, WhatsApp, in-app) on Django + AWS S3, handling 1,000+ events a day and cutting onboarding effort by 50%.",
      "AWS SQS in front of Lambda to process notifications asynchronously, trading synchronous overhead for delivery reliability on high-volume workflows.",
      "JWT/OAuth2 authentication and RBAC across internal services.",
      "GitHub Actions CI/CD for EC2, cutting release cycles from hours down to under 15 minutes.",
      "Frontend work in React.js and Flutter, cutting internal feature rollout time by 25%.",
    ],
    stack: [
      "MCP",
      "Django",
      "AWS S3",
      "AWS SQS",
      "Lambda",
      "JWT",
      "OAuth2",
      "RBAC",
      "GitHub Actions",
      "AWS EC2",
      "React.js",
      "Flutter",
    ],
  },
] as const;

export type Project = {
  name: string;
  year?: string;
  href?: string;
  linkLabel?: string;
  status?: string;
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
    summary:
      "Runs the daily practice for a working law office, multi-tenant and live in production.",
    decision:
      "Underneath: eCourts automated end to end (sessions, CAPTCHA, anti-scraping headers) feeding a 3-node LangGraph pipeline for source-referenced document search.",
    stack: [
      "Django",
      "DRF",
      "LangGraph",
      "pgvector",
      "PostgreSQL",
      "AWS EC2",
      "RDS",
      "Nginx",
      "gunicorn",
      "CI/CD",
    ],
  },
  {
    name: "Composite Sketch & Criminal Face Identification System",
    year: "2026",
    summary:
      "A forensic face-recognition platform: Django REST Framework and PostgreSQL pgvector doing similarity search across criminal profile datasets.",
    decision:
      "Faces are embedded with dlib's 128-D face embeddings and matched by vector similarity search; uploads, retrieval, and search all go through S3-backed REST APIs.",
    stack: ["Django REST Framework", "pgvector", "dlib", "AWS S3", "REST APIs"],
  },
  {
    name: "Automated Attendance Management System",
    year: "2024",
    summary:
      "A real-time face-recognition attendance system that cut manual attendance tracking effort by 90% during classroom operations.",
    decision:
      "Multithreaded frame processing brought recognition latency from 1.2s down to 0.8s (33% faster), and iterative testing plus dataset tuning pushed recognition accuracy from 85% to 92%. Ran on AWS EC2 at 99.9% uptime through a semester-long pilot with 30+ students.",
    stack: ["OpenCV", "Redis", "SQLite", "AWS EC2"],
  },
  {
    name: "YouTube Shorts Automation Pipeline",
    summary:
      "An end-to-end pipeline that scripts, voices, animates, and uploads short-form video without a human in the loop.",
    decision:
      "Groq writes the script, edge-tts voices it, ComfyUI drives Ken Burns motion over still frames, then it's a straight shot through the YouTube Data API to publish.",
    stack: ["Groq", "edge-tts", "ComfyUI", "YouTube Data API v3"],
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
      "Backend and platform work on Django and AWS: notifications, queueing, auth, CI/CD, and an MCP integration for Gathr.",
    bullets: [...experience[0].bullets],
    metrics: [
      {
        label: "events/day",
        value: "1,000+",
        note: "multi-channel notification system",
      },
      { label: "onboarding effort", value: "-50%" },
      { label: "feature rollout time", value: "-25%" },
      { label: "release cycle", value: "under 15 min", from: "hours", to: "under 15 min" },
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
    summary: projects[0].summary,
    bullets: [projects[0].decision],
    // The two coverage numbers are the showcase panels' own stats, already on
    // screen in classic mode. The node count is stated in the decision line.
    metrics: [
      { label: "districts scanned", value: "33 / 33" },
      { label: "list types read", value: "8 / 8" },
      { label: "LangGraph pipeline", value: "3 nodes" },
      { label: "tests passing", value: "360" },
    ],
    // Extends projects[0].stack rather than editing it, so the classic project
    // card is unchanged. These are the terms from the architecture that are
    // real parts of the stack but have no step of their own in the flow, and
    // the density rule says a term without a place in a flow belongs in the
    // tags rather than in a box.
    stack: [
      ...projects[0].stack,
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
    id: "composite-sketch",
    kind: "project",
    title: "Composite Sketch & Criminal Face Identification System",
    when: "2026",
    featured: false,
    summary: projects[1].summary,
    bullets: [projects[1].decision],
    metrics: [{ label: "face embedding", value: "128-D", note: "dlib" }],
    stack: [...projects[1].stack],
  },
  {
    id: "attendance",
    kind: "project",
    title: "Automated Attendance Management System",
    when: "2024",
    featured: false,
    summary: projects[2].summary,
    bullets: [projects[2].decision],
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
    stack: [...projects[2].stack],
  },
  {
    id: "youtube-shorts",
    kind: "project",
    title: "YouTube Shorts Automation Pipeline",
    when: "",
    featured: false,
    summary: projects[3].summary,
    bullets: [projects[3].decision],
    metrics: [],
    stack: [...projects[3].stack],
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
export const journeys: Journey[] = [
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

// My Favorites (anime/movie/show list) has grown enough fields (YouTube
// config, captions) to outgrow this file: see src/content/watching.ts.
