import Link from "next/link";
import { maxCoverage } from "@tea/core";

export default function Home() {
  const coverage = Math.round(maxCoverage(60, [8, 5, 10, 6]) * 100);

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-16">
      <p className="eyebrow mb-3">Core Apex</p>
      <h1 className="font-display text-3xl font-bold text-ink-display">
        Engagement
      </h1>
      <p className="text-muted mt-3">
        Foundation in place. Coverage forecast reads live from{" "}
        <code className="text-ink">packages/core</code>: 60 people across activities of
        8, 5, 10 and 6 — each person meets at most <strong>{coverage}%</strong> of the
        room.
      </p>
      <Link
        href="/style"
        data-tap
        className="inline-flex items-center mt-6 bg-brand hover:bg-brand-hover text-white font-medium px-5 py-3 rounded-md"
      >
        Brand system
      </Link>
    </main>
  );
}
