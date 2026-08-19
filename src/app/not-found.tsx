import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-stone">
        404
      </p>
      <h1 className="mt-4 font-display text-4xl font-medium text-mist sm:text-5xl">
        Nothing at this address.
      </h1>
      <Link
        href="/"
        className="mt-8 font-mono text-sm uppercase tracking-wider text-jacket-bright underline decoration-jacket-bright/40 underline-offset-4 transition-colors hover:decoration-jacket-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jacket-bright focus-visible:ring-offset-4 focus-visible:ring-offset-ink rounded-sm"
      >
        Back to the top
      </Link>
    </main>
  );
}
