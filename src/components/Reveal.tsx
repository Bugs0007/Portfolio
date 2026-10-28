import type { ReactNode } from "react";

// Content is visible in the server HTML and stays still while scrolling.
// Keep the existing API so sections can opt into animation again individually.
export function Reveal({ children, className }: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  return <div className={className}>{children}</div>;
}
