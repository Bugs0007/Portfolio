// Metric values in site.ts are written the way they read in the prose they
// came from ("1,000+", "-50%", "under 15 min", "33 / 33"), not as numbers with
// a separate unit field. That is deliberate: the string is the thing that gets
// shown, and splitting it into parts in the data would have meant maintaining
// a format alongside every value.
//
// So metrics mode parses the number back out here instead, purely to drive a
// count. If a value has no number in it at all ("hours"), it simply does not
// count, and the value is rendered as written.

export type ParsedValue = {
  prefix: string;
  value: number;
  suffix: string;
  decimals: number;
  grouped: boolean;
};

// Leading non-digits become the prefix ("under "), the first number is the
// value, and everything after it is the suffix ("%", "+", " min", " / 33").
// Keeping the trailing half as an opaque suffix is what makes "33 / 33" count
// correctly: it renders "12 / 33" on the way and lands on "33 / 33".
const PATTERN = /^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/;

export function parseValue(text: string): ParsedValue | null {
  const match = PATTERN.exec(text.trim());
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  const plain = digits.replace(/,/g, "");
  const value = Number(plain);
  if (!Number.isFinite(value)) return null;
  const dot = plain.indexOf(".");
  return {
    prefix,
    value,
    suffix,
    decimals: dot === -1 ? 0 : plain.length - dot - 1,
    grouped: digits.includes(","),
  };
}

export function formatValue(parsed: ParsedValue, value: number): string {
  const fixed = value.toFixed(parsed.decimals);
  const body = parsed.grouped
    ? Number(fixed).toLocaleString("en-US", {
        minimumFractionDigits: parsed.decimals,
        maximumFractionDigits: parsed.decimals,
      })
    : fixed;
  return `${parsed.prefix}${body}${parsed.suffix}`;
}

// What a metric should animate between. A from/to pair counts between the two
// real numbers; a single value counts up from zero to it. Either can come back
// null, which means "render the text as written and do not animate it".
export function countRange(metric: {
  value: string;
  from?: string;
  to?: string;
}): { start: number; parsed: ParsedValue } | null {
  if (metric.from && metric.to) {
    const from = parseValue(metric.from);
    const to = parseValue(metric.to);
    // Both halves have to be numbers for a transition between them to mean
    // anything. "hours -> under 15 min" deliberately falls through to static.
    if (!from || !to) return null;
    return { start: from.value, parsed: to };
  }
  const parsed = parseValue(metric.value);
  if (!parsed) return null;
  return { start: 0, parsed };
}
