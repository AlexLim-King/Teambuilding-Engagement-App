import type { Metadata } from "next";

export const metadata: Metadata = { title: "Core Apex — Brand" };

/* Contrast ratios computed against white and verified against WCAG AA.
   Kept visible so a value can never quietly drift below the threshold. */
const swatches = [
  { token: "brand", hex: "#DC1B21", use: "Primary actions, currency", onWhite: "4.97:1" },
  { token: "brand-hover", hex: "#B81419", use: "Pressed and hover", onWhite: "6.6:1" },
  { token: "brand-deep", hex: "#6B0000", use: "Wordmark gradient only", onWhite: "12.4:1" },
  { token: "ink", hex: "#141414", use: "Body text", onWhite: "17.4:1" },
  { token: "muted", hex: "#52525B", use: "Secondary text", onWhite: "7.7:1" },
  { token: "danger", hex: "#7F1D1D", use: "Destructive, errors", onWhite: "10.0:1" },
];

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline pt-6">
      <p className="eyebrow mb-4">{label}</p>
      {children}
    </section>
  );
}

export default function StyleGuide() {
  return (
    <>
      {/* Chrome mirrors the staff polo: black, with the mark on the chest. */}
      <header className="bg-chrome text-white px-5 py-3 flex items-center gap-3">
        <span className="font-display font-bold tracking-tight text-lg">
          <span className="text-brand">C</span>A
        </span>
        <span className="eyebrow !text-white/60">Core Apex · Engagement</span>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 py-10 flex flex-col gap-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-display">Brand system</h1>
          <p className="text-muted mt-2">
            Derived from the logo. Light base throughout — participants use this outdoors,
            where a white background at full brightness beats any dark theme.
          </p>
        </div>

        <Section label="Colour">
          <div className="flex flex-col gap-2">
            {swatches.map((s) => (
              <div key={s.token} className="flex items-center gap-4">
                <span
                  className="h-10 w-10 rounded shrink-0 border border-hairline"
                  style={{ background: s.hex }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {s.token} <span className="text-muted font-normal">{s.hex}</span>
                  </p>
                  <p className="text-sm text-muted truncate">{s.use}</p>
                </div>
                <span className="text-sm text-muted tabular-nums shrink-0">{s.onWhite}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section label="The team number">
          <div className="bg-surface-sunk rounded-lg p-8 text-center">
            <p className="eyebrow mb-2">You are in</p>
            <p className="team-number">7</p>
          </div>
          <p className="text-sm text-muted mt-3">
            Read at arm&apos;s length across a noisy room. Pure black on near-white, never a
            brand colour — this is the one screen that must survive direct sunlight.
          </p>
        </Section>

        <Section label="Currency">
          <div className="bg-surface-sunk rounded-lg p-8 text-center">
            <p className="eyebrow mb-2">Released</p>
            <p className="font-display text-5xl font-bold text-brand">+50</p>
            <p className="text-muted mt-2">coins · Team 3, 1st place</p>
          </div>
          <p className="text-sm text-muted mt-3">
            Deliberately plain — brand red on the figure, no gradient, no flourish. The
            moment lands because the number moves, not because it is decorated.
          </p>
        </Section>

        <Section label="Names">
          <div className="rounded-lg border border-hairline overflow-hidden">
            <div className="row-selected px-4 py-3 person-name font-medium">Alina Tan</div>
            <div className="px-4 py-3 person-name border-t border-hairline">Ben Lim</div>
            <div className="px-4 py-3 person-name border-t border-hairline">Chloe Devi</div>
          </div>
          <p className="text-sm text-muted mt-3">
            <strong className="text-ink">Participant names are never red</strong>, and never
            sit on a red fill — it reads badly in Malaysian corporate settings, and names
            appear on nearly every screen here. Selection is a neutral ground with a black
            rule. Red is reserved for controls and actions.
          </p>
        </Section>

        <Section label="Actions">
          <div className="flex flex-wrap gap-3">
            <button className="bg-brand hover:bg-brand-hover text-white font-medium px-5 rounded-md">
              Form teams
            </button>
            <button className="border border-hairline hover:bg-surface-sunk text-ink font-medium px-5 rounded-md">
              Cancel
            </button>
            <button className="border border-danger text-danger hover:bg-surface-sunk font-medium px-5 rounded-md">
              Forfeit 150 coins
            </button>
          </div>
          <p className="text-sm text-muted mt-3">
            Brand red means <em>primary action</em>, so destructive actions are never solid
            red — they are outlined in maroon and always name what they will do.
          </p>
        </Section>

        <Section label="Rating control">
          <p className="font-medium mb-1">Made it easier for others to contribute</p>
          <div className="flex gap-2 mt-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`flex-1 h-14 rounded-md border font-display text-lg font-semibold ${
                  n === 4
                    ? "bg-brand border-brand text-white"
                    : "border-hairline hover:bg-surface-sunk"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted mt-2">
            <span>Rarely</span>
            <span>Consistently</span>
          </div>
          <p className="text-sm text-muted mt-3">
            Behavioural anchors rather than Excellent/Poor — it lowers the ceiling effect and
            makes a 3 feel like an observation rather than an insult.
          </p>
        </Section>

        <Section label="Type">
          <p className="font-display text-2xl font-bold">Oxanium — display only</p>
          <p className="text-muted text-sm mb-4">
            Team numbers, currency, headings. Angular and extended, nearest free match to the
            wordmark.
          </p>
          <p className="text-xl">Inter — everything readable</p>
          <p className="text-muted text-sm">
            Names, forms, body. Chosen for legibility at 320px on a cheap Android.
          </p>
          <p className="eyebrow mt-4">Discover by experience</p>
          <p className="text-muted text-sm">
            The tagline&apos;s letterspacing, reused as the section label throughout.
          </p>
        </Section>
      </main>
    </>
  );
}
