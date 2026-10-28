import type { ReactNode } from "react";

// Native scrolling avoids a continuously running wheel-interpolation loop.
// Anchor navigation uses the browser's smooth scroll, with reduced-motion support.
export function SmoothScroll({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
