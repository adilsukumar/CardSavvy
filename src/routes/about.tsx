import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Methodology & about — CardSavvy" },
      {
        name: "description",
        content: "How the CardSavvy score is calculated and how we keep card data up to date.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">Methodology & about</h1>

      <h2 className="mt-8 text-xl font-semibold">The optimizer score</h2>
      <p className="mt-2 text-muted-foreground">
        Every card on CardSavvy gets a score out of 100 that combines two ingredients:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-muted-foreground">
        <li>
          <strong className="text-foreground">Automated score</strong> — a weighted model over the
          card's features (lounge access, no-FX-fee, transfer partners, etc.), reward rate, and fee
          efficiency. Weights shift for category-specific rankings so the right perks dominate.
        </li>
        <li>
          <strong className="text-foreground">Editor's pick bonus</strong> — a hand-curated bump for
          cards that we think genuinely lead a category, based on broader context the model can't
          see (community sentiment, transfer-bonus history, customer service).
        </li>
      </ul>
      <p className="mt-4 text-muted-foreground">
        You can see the breakdown on every card page so the ranking is never a black box.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Global coverage</h2>
      <p className="mt-2 text-muted-foreground">
        We cover cards from major markets including the United States, United Kingdom, European
        Union, India, China, the UAE, Singapore, Canada, Australia and Japan. New cards and
        countries are added as the dataset grows.
      </p>

      <h2 className="mt-10 text-xl font-semibold">How the data stays fresh</h2>
      <p className="mt-2 text-muted-foreground">
        Card data is stored in a versioned dataset that ships with the site, so every deploy is a
        refresh. The architecture is ready to swap in a live data source (e.g. a Firestore
        collection) later without changing the UI.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Monetization</h2>
      <p className="mt-2 text-muted-foreground">
        Apply links on card pages may be affiliate links — we may earn a commission when you're
        approved, at no cost to you. Rankings are <em>not</em> influenced by affiliate payouts; the
        optimizer score is computed identically regardless of monetization.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Not financial advice</h2>
      <p className="mt-2 text-muted-foreground">
        Information here is educational. Always confirm the latest terms with the issuer before
        applying.
      </p>

      <div className="mt-10">
        <Link to="/" className="text-primary hover:underline">
          ← Back to home
        </Link>
      </div>
    </article>
  );
}
