import { person } from "@/content/site";

const linkClass =
  "transition-colors hover:text-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink rounded-sm";

// The escape hatch for recruiters. Survives the entire scroll, on every
// section, light or dark.
export function PersistentNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
    >
      <div className="flex items-center gap-3 rounded-full border border-mist/15 bg-ink/75 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-mist/80 backdrop-blur-md sm:gap-5 sm:px-5 sm:text-xs">
        <a href="/resume" className={linkClass}>
          Résumé
        </a>
        <span aria-hidden className="text-stone">
          ·
        </span>
        <a
          href={person.github}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          GitHub
        </a>
        <span aria-hidden className="text-stone">
          ·
        </span>
        <a
          href={person.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          LinkedIn
        </a>
      </div>
    </nav>
  );
}
