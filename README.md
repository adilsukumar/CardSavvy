# CardSavvy

A credit-card comparison and wallet prototype by Adil Sukumar. Browse a bundled catalogue by country, category and benefits; compare cards, inspect transparent heuristic rankings, and keep wallet/spending/application records in your browser.

**[Open the live application](https://cardsavvy-adil-sukumar.vercel.app/)**

Built by [Adil Sukumar](https://www.adilsukumar.xyz/).

## Run locally

Use Node.js 22 or later and npm:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The core catalogue does not need API credentials or a database. Optional service configuration is described in `.env.example`:

- `GROQ_API_KEY`: server-only AI chat. Without it, chat explains that it is unavailable.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: optional public client for community-offer storage. Configure row-level security on your own database. Never use a service-role key in browser configuration.

## Check the project

```sh
npm test
npm run typecheck
npm run build
```

The app uses React, TypeScript, TanStack Start/Router, Tailwind CSS and Radix/shadcn components. The production build produces a server-rendered application; deploy to a compatible server/adapter, not a static-only host without configuring an export.

## Deploy to Vercel

Import this repository into Vercel, use Node.js 22 or later, and keep the build command `npm run build`. The Nitro adapter in `vite.config.ts` emits the Vercel Build Output API layout in `.vercel/output`, including server functions. The local catalogue works without secrets; configure optional integrations only through server/project environment settings. Never commit `.vercel`, build output or credentials.

The public deployment keeps optional AI chat and database services unconfigured. Rankings, filters, comparison, card detail pages and the browser-local wallet remain usable.

## What the rankings mean

Scores combine weighted benefits, fees and editorial selections. They are a product-design heuristic, not a trained credit model, approval prediction or verified measure of financial return. Currency multipliers are fixed reference assumptions in `src/lib/scoring.ts`, not live exchange rates. Catalogue terms and issuer URLs may be outdated; verify current eligibility, rates and offers with the issuer. Community-post imports are not verified issuer offers and have no inferred expiry date.

Wallet records are browser-local and are not a secure banking ledger. Do not enter card numbers, CVVs, passwords or bank credentials. Optional AI chat sends the submitted conversation to the configured provider; optional offer sync contacts external community/RSS services. A public deployment should add application-level authentication, rate limiting and provider-budget controls before enabling AI chat.

## Public edition

- Removed embedded provider credentials and shared database configuration.
- Kept application source and one npm lockfile; omitted one-off catalogue injection scripts, browser experiments, logs, screenshots, generated builds and installed packages.
- Added environment-based optional integrations and bounded chat input.
- Fixed currency-normalized beginner scoring, duplicate feature weighting, future-date labels and malformed local-storage arrays.
- Stopped assigning invented expiry dates to scraped community offers.

## Structure

`src/data` contains the bundled catalogue and types. `src/lib/scoring.ts` holds the ranking formula. `src/lib/wallet.ts` manages browser-local records. `src/routes` contains page routes; `src/lib/api` contains optional server functions. `tests` covers score/date regressions.

Public visibility is not a claim that every card term has been verified or that this prototype is ready for production banking use.
