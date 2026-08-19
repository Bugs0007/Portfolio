export type WatchingCategory = "anime" | "film";

export type WatchingEntry = {
  slug: string;
  title: string;
  category: WatchingCategory;
  // NEEDS: a real YouTube video ID (trailer or clip) and a start timestamp
  // for every entry below. Left blank rather than guessed: an entry with no
  // ID never tries to create a player, it just shows its poster forever.
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
    youtubeId: "",
    startSeconds: 0,
    caption: "“As long as I'm alive, there are infinite chances.” — Luffy",
  },
  { slug: "haikyuu", title: "Haikyuu!!", category: "anime", youtubeId: "", startSeconds: 0 },
  {
    slug: "attack-on-titan",
    title: "Attack on Titan",
    category: "anime",
    youtubeId: "",
    startSeconds: 0,
  },
  { slug: "your-name", title: "Your Name", category: "anime", youtubeId: "", startSeconds: 0 },
  { slug: "naruto", title: "Naruto", category: "anime", youtubeId: "", startSeconds: 0 },
  { slug: "interstellar", title: "Interstellar", category: "film", youtubeId: "", startSeconds: 0 },
  { slug: "fight-club", title: "Fight Club", category: "film", youtubeId: "", startSeconds: 0 },
  { slug: "rush-hour-2", title: "Rush Hour 2", category: "film", youtubeId: "", startSeconds: 0 },
  { slug: "spider-man-2", title: "Spider-Man 2", category: "film", youtubeId: "", startSeconds: 0 },
  { slug: "creed-2", title: "Creed II", category: "film", youtubeId: "", startSeconds: 0 },
];
