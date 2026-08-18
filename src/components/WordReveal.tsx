"use client";

import { motion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

// Word-by-word editorial reveal, for short headline-length text only. The
// real string stays the accessible name; the split words are aria-hidden.
// The trailing space per word sits outside the motion.span deliberately:
// trailing whitespace inside an inline-block gets collapsed away by the
// browser, which would silently glue every word together.
export function WordReveal({
  text,
  className,
  wordClassName,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
}) {
  const words = text.split(" ");

  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden style={{ display: "inline-block" }}>
          <motion.span
            className={`inline-block ${wordClassName ?? ""}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE, delay: i * 0.07 }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
