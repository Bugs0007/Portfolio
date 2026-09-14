"use client";

import { useEffect, useState } from "react";

/**
 * `value`, but it only turns true once it has stayed true for `ms`. It turns
 * false straight away.
 *
 * For media reach: a section-nav jump flies past everything between two
 * sections in about a second, and anything that started a download on the way
 * past kept downloading after it was gone. Asymmetric on purpose, since letting
 * go of something should never wait.
 */
export function useSettled(value: boolean, ms: number) {
  const [settled, setSettled] = useState(false);

  // Falling edge, derived during render rather than in an effect.
  if (!value && settled) setSettled(false);

  useEffect(() => {
    if (!value || settled) return;
    const t = setTimeout(() => setSettled(true), ms);
    return () => clearTimeout(t);
  }, [value, settled, ms]);

  return settled;
}
