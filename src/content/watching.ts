export type WatchingCategory = "anime" | "movie" | "show";

export type WatchingEntry = {
  slug: string;
  title: string;
  category: WatchingCategory;
  // Official trailer IDs, sourced and checked individually rather than
  // guessed: a wrong ID risks surfacing the wrong (or an unrelated) video.
  // startSeconds is a best-effort skip past studio logos/black frames, not
  // verified frame by frame, nudge it in content/watching.ts if a clip
  // opens on a bad beat.
  youtubeId: string;
  startSeconds: number;
  // Only One Piece has one. Rendered as a fading caption over the video
  // once it starts playing, nowhere else.
  caption?: string;
};

// Poster art lives at /media/watching/<slug>.jpg, one file per entry below,
// same convention as every other section's public/media/<section>/ folder.
export const watchingEntries: WatchingEntry[] = [
  {
    slug: "one-piece",
    title: "One Piece",
    category: "anime",
    youtubeId: "1KMcoJBMWE4",
    startSeconds: 5,
    caption: "“As long as I'm alive, there are infinite chances.” — Luffy",
  },
  {
    slug: "haikyuu",
    title: "Haikyuu!!",
    category: "anime",
    youtubeId: "JOGp2c7-cKc",
    startSeconds: 8,
  },
  {
    slug: "attack-on-titan",
    title: "Attack on Titan",
    category: "anime",
    youtubeId: "n4Nj6Y_SNYI",
    startSeconds: 8,
  },
  {
    slug: "your-name",
    title: "Your Name",
    category: "anime",
    youtubeId: "RuyHIkXdYf8",
    startSeconds: 10,
  },
  {
    slug: "naruto",
    title: "Naruto",
    category: "anime",
    youtubeId: "yeUpnIKt6k4",
    startSeconds: 8,
  },
  {
    slug: "interstellar",
    title: "Interstellar",
    category: "movie",
    youtubeId: "2LqzF5WauAw",
    startSeconds: 15,
  },
  {
    slug: "fight-club",
    title: "Fight Club",
    category: "movie",
    youtubeId: "yxQmJXZOZ30",
    startSeconds: 10,
  },
  {
    slug: "rush-hour-2",
    title: "Rush Hour 2",
    category: "movie",
    youtubeId: "5rum1mtdgHw",
    startSeconds: 8,
  },
  {
    slug: "spider-man-2",
    title: "Spider-Man 2",
    category: "movie",
    youtubeId: "7BK2Bg9liDk",
    startSeconds: 8,
  },
  {
    slug: "creed-2",
    title: "Creed II",
    category: "movie",
    youtubeId: "Si7pC7LdB4E",
    startSeconds: 12,
  },
  {
    slug: "silicon-valley",
    title: "Silicon Valley",
    category: "show",
    youtubeId: "69V__a49xtw",
    startSeconds: 5,
  },
  {
    slug: "game-of-thrones",
    title: "Game of Thrones",
    category: "show",
    youtubeId: "J7JYw5kQg_Y",
    startSeconds: 8,
  },
  {
    slug: "suits",
    title: "Suits",
    category: "show",
    // NEEDS: could only confirm this against Universal Channel Germany's
    // international broadcaster upload, not a USA Network/US channel one.
    youtubeId: "qcqRbm56gIs",
    startSeconds: 5,
  },
  {
    slug: "house-md",
    title: "House M.D.",
    category: "show",
    // NEEDS: no confirmed official Fox/NBCUniversal channel upload found
    // for this one, correct content on a re-upload channel instead.
    youtubeId: "izE5Dwy5b70",
    startSeconds: 5,
  },
  {
    slug: "big-bang-theory",
    title: "The Big Bang Theory",
    category: "show",
    // NEEDS: same as above, correct trailer but not from CBS/Warner Bros.'
    // own channel.
    youtubeId: "WBb3fojgW0Q",
    startSeconds: 5,
  },
];
