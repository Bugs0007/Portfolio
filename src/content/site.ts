// Real content only, no lorem ipsum, no invented achievements.
// Unresolved facts are marked NEEDS and are also listed back to Bhagath in chat.

export const person = {
  name: "Bhagath Samalla",
  tagline:
    "I write backend systems for a living, and disappear into the Himalayas when I can get away with it.",
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
      "Multi-tenant Django/DRF platform live in production for real advocates: row-level data isolation, its own domain, deployed on AWS (EC2, RDS/pgvector, Nginx/gunicorn) with CI/CD.",
    decision:
      "Case discovery runs against India's eCourts government portal, which isn't built to be automated: session/token handling, rotating anti-scraping headers, and CAPTCHA solving feed an async, resumable pipeline that reliably pulls 100,000+ real case records per run. On top of that sits a 3-node LangGraph pipeline (HyDE query expansion, hybrid pgvector/tsvector retrieval with reciprocal rank fusion, cross-encoder reranking) for source-referenced document Q&A, with a cost-gated routing step that skips LLM calls on routine documents.",
    highlights: [
      "Postgres-native async job pipeline (no external broker) for long-running, CAPTCHA-gated operations, with incremental persistence and automatic retry of failed segments.",
      "Invoicing subsystem: PDF generation, race-safe per-user invoice numbering under concurrent load, transactional email delivery.",
    ],
    stack: ["Django", "DRF", "LangGraph", "pgvector", "PostgreSQL", "AWS EC2", "RDS", "Nginx", "gunicorn", "CI/CD"],
  },
  {
    name: "Composite Sketch & Criminal Face Identification System",
    year: "2026",
    status: "in progress",
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

export const music = {
  intro:
    "Learning flute and guitar. The flute goal is the Krrish theme (Raga Hamsadhvani), which is exactly as hard as it sounds on an instrument with no frets.",
  media: {
    poster: "/media/music/poster.jpg",
    loop: "/media/music/loop.mp4",
    width: 1920,
    height: 780,
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
  blurb: string;
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
    region: "Lahaul and Ladakh",
    when: "May to June 2026",
    blurb:
      "Up through Lahaul and over the passes into Zanskar. The clearest sky I have ever slept under, a stray dog who adopted us for an afternoon, and somebody's kid handed to me for a photo I am still not sure I earned.",
    media: [
      {
        kind: "image",
        src: "/media/travel/sethan-forest.jpg",
        width: 1800,
        height: 2400,
        alt: "Bhagath walking down a forest trail beneath tall pines near Sethan, Himachal Pradesh.",
        caption: "Sethan",
        coords: { lat: 32.2395, lon: 77.226 },
      },
      {
        kind: "image",
        src: "/media/travel/jispa-stargazing.jpg",
        width: 2400,
        height: 1800,
        alt: "Bhagath standing beneath a dense, star-filled night sky at Jispa, silhouetted against a mountain ridge.",
        caption: "Jispa",
        coords: { lat: 32.6011, lon: 77.1451 },
      },
      {
        kind: "image",
        src: "/media/travel/gonbo-rangjon.jpg",
        width: 2400,
        height: 1350,
        alt: "Bhagath facing a fog-wrapped rock spire, Gonbo Rangjon, on the road into Zanskar.",
        caption: "Gonbo Rangjon",
        coords: { lat: 32.9769, lon: 77.2514 },
      },
      {
        kind: "image",
        src: "/media/travel/pensi-la.jpg",
        width: 2400,
        height: 1350,
        alt: "Bhagath seated on a rock at Pensi La, snow-capped Himalayan peaks visible behind him.",
        caption: "Pensi La",
      },
      {
        kind: "image",
        src: "/media/travel/zanskar-dog.jpg",
        width: 2400,
        height: 1350,
        alt: "Bhagath crouching to pet a golden-haired stray dog at a roadside market stall in Zanskar, Ladakh.",
        caption: "Zanskar Valley",
        coords: { lat: 33.4691, lon: 76.8796 },
      },
      {
        kind: "image",
        src: "/media/travel/zanskar-monastery-tea.jpg",
        width: 2400,
        height: 1109,
        alt: "Bhagath drinking tea on a monastery wall overlooking a valley in Zanskar, Ladakh.",
        caption: "Zanskar, monastery",
      },
      {
        kind: "image",
        src: "/media/travel/zanskar-baby.jpg",
        width: 2400,
        height: 1109,
        alt: "Bhagath holding a sleeping local baby indoors in Zanskar, Ladakh.",
        caption: "Zanskar Valley",
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
    title: "Manali in the snow",
    region: "Himachal Pradesh",
    when: "January 2026",
    blurb:
      "Back in Himachal in winter. Nine of us on one snowbank, then running off a hillside at Solang with a parachute and no regrets.",
    media: [
      {
        kind: "image",
        src: "/media/travel/koksar-group.jpg",
        width: 2400,
        height: 1800,
        alt: "Bhagath and eight friends sitting together on a snowy mountainside near Koksar.",
        caption: "Koksar",
        coords: { lat: 32.4076, lon: 77.2426 },
      },
      {
        kind: "image",
        src: "/media/travel/manali-paragliding.jpg",
        width: 2400,
        height: 1109,
        alt: "Bhagath paragliding in tandem at sunset near Manali, silhouetted against an orange sky.",
        caption: "Solang Valley",
      },
    ],
  },
  {
    id: "coimbatore",
    title: "Coimbatore",
    region: "Tamil Nadu",
    when: "2025",
    blurb:
      "Grasslands that look nothing like the rest of Tamil Nadu, and a sunset with the people who talked me into the trek.",
    media: [
      {
        kind: "image",
        src: "/media/travel/coimbatore-trek.jpg",
        width: 1800,
        height: 2400,
        alt: "Bhagath standing in windswept grass on a hilltop during the Kenmangudi trek near Coimbatore.",
        caption: "Kenmangudi",
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
    ],
  },
  {
    id: "uttarakhand",
    title: "Uttarakhand",
    region: "Kedarnath, Badrinath, Mana",
    when: "May 2024",
    blurb:
      "Rode a horse most of the way up to Kedarnath and ached for a week. The mountain behind the temple made the whole trip look small.",
    media: [
      {
        kind: "image",
        src: "/media/travel/kedarnath-horse-ride.jpg",
        width: 1800,
        height: 2400,
        alt: "Bhagath with arms outstretched on a horse trek toward Kedarnath, clouds rolling over the trail.",
        caption: "On the way to Kedarnath",
      },
      {
        kind: "image",
        src: "/media/travel/kedarnath-temple.jpg",
        width: 1284,
        height: 2282,
        alt: "Kedarnath temple crowded with pilgrims, snow-capped peaks rising directly behind it.",
        caption: "Kedarnath",
      },
      {
        kind: "image",
        src: "/media/travel/badrinath.jpg",
        width: 2400,
        height: 1109,
        alt: "Badrinath temple complex with prayer flags, seen from above against a forested hillside.",
        caption: "Badrinath",
      },
      {
        kind: "image",
        src: "/media/travel/mana-village.jpg",
        width: 1350,
        height: 2400,
        alt: "Bhagath sitting on a rock near Mana Village as clouds roll in over the mountains.",
        caption: "Mana Village",
      },
    ],
  },
];

export const art = {
  note: "Paint and sketch when I get the chance.",
  paintings: [
    {
      src: "/media/art/elephant.jpg",
      width: 1204,
      height: 1821,
      alt: "Acrylic painting by Bhagath of an elephant's face in warm oranges and yellows.",
    },
    {
      src: "/media/art/ganesh.jpg",
      width: 1539,
      height: 1818,
      alt: "Acrylic painting by Bhagath of Ganesh in warm reds and golds.",
    },
    {
      src: "/media/art/tiger.jpg",
      width: 923,
      height: 1389,
      alt: "Acrylic painting by Bhagath of a tiger wading through blue water.",
    },
  ],
};

export const riding = {
  bike: null as string | null, // NEEDS: make/model. A few bikes show up in photos, unconfirmed which is his
  namedRides: [
    {
      name: "Parigi",
      note: "Windmills and backroads out past Vikarabad, ridden with friends.",
    },
  ],
  video: {
    poster: "/media/riding/visor-poster.jpg",
    loop: "/media/riding/visor-loop.mp4",
    width: 1920,
    height: 1080,
    alt: "POV shot of a motorcycle visor closing while riding.",
  },
  photos: [
    {
      src: "/media/riding/yellow-grass-bike.jpg",
      width: 2400,
      height: 1350,
      alt: "Bhagath riding a motorcycle across a dry grass field with wind turbines in the distance, Parigi.",
    },
    {
      src: "/media/riding/three-bikes-windmill.jpg",
      width: 2400,
      height: 1800,
      alt: "Three motorcycles parked in a field with wind turbines behind them, Parigi.",
    },
    {
      src: "/media/riding/three-bikes-parigi.jpg",
      width: 2400,
      height: 1109,
      alt: "A rider approaching three parked motorcycles at dusk, wind turbines on the horizon, Parigi.",
    },
    {
      src: "/media/riding/helmet-night.jpg",
      width: 2400,
      height: 1109,
      alt: "Bhagath wearing a Batman-branded helmet on a motorcycle at night.",
    },
    {
      src: "/media/riding/parigi-sunrise.jpg",
      width: 2400,
      height: 1800,
      alt: "Sunrise over open fields near Parigi.",
    },
  ],
};

export const watching: { title: string; note: string }[] = []; // NEEDS: favorites list
