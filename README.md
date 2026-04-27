# OzWealthman

OzWealthman is a premium Australian personal finance and wealth dashboard built with React Native, Expo, TypeScript and Supabase.

## Current Slice

- Expo Router with a desktop web command shell and mobile bottom tabs.
- Property command centre with property bills, projections, deal analysis and area research scaffolding.
- Tax and SMSF audit checklist route for PAYG, investment tax prep and SMSF compliance tracking.
- Premium theme system with light and dark mode support.
- Seeded Australian wealth data covering salary, family spending, super, SMSF property, ETFs, Bitcoin, cash, gold and silver.
- Deterministic calculation services for dashboard rollups, SMSF summary, super projections, allocation and bullion valuation.
- Detailed bullion lot drill-down with spot comparison, cost base, estimated value and unrealized gain/loss.
- Mock AI coach with a typed tool registry and confirmation cards before material updates.
- Supabase schema for auth-adjacent app data, pending AI actions and dashboard snapshots.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Fill in Supabase values when you are ready to persist data:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
```

4. Start the mobile app:

```bash
npm.cmd start
```

For desktop web preview:

```bash
npm.cmd run web:local
```

For Expo Go on Android:

```bash
npm.cmd start -- --go --lan -c
```

Export a static web build:

```bash
npm.cmd run web:export
```

## Supabase

Run `supabase/schema.sql` in your Supabase SQL editor or migration workflow. The first MVP uses `src/data/seed.ts` for an immediate mobile demo, then can replace the seed source with Supabase queries through a repository layer.

## AI Architecture

The assistant is structured around tools in `src/ai/toolRegistry.ts`. The mocked coach can:

- Retrieve dashboard, budget, super, SMSF and bullion summaries.
- Retrieve property analysis and tax checklist summaries.
- Prepare material updates as `PendingAction` records.
- Prepare property bills from commands like "water is paid for Chevron at $322".
- Require explicit confirmation before save.
- Confirm or cancel pending actions.

`src/ai/openaiClient.ts` shows the OpenAI Responses API adapter. For production, call OpenAI from a Supabase Edge Function or secure backend proxy so mobile clients never ship a secret API key.

## Live Price APIs

Connect pricing providers in `src/services/pricing.ts` and normalize everything into AUD before it reaches the calculation layer. The app now uses interface-based providers for:

- Gold spot
- Silver spot
- ETF prices
- Crypto prices

The default `UnconfiguredPricingProvider` returns unavailable quote states. UI and refresh jobs can use `src/services/livePricingService.ts` to receive graceful fallback quotes from stored portfolio prices when live prices are unavailable.

Recommended future provider connection points:

- Bullion spot prices: ABC Bullion, Perth Mint, LBMA-backed data, or a metals market-data API.
- ETFs and shares: ASX-compatible market data provider.
- Crypto: exchange or aggregator data normalized into AUD.

Do not allow the AI to invent prices. Store fetched prices with timestamp and source metadata, then recalculate snapshots through deterministic services.

## Property Research

`src/services/propertyServices.ts` includes the first version of the OzWealthman Property Analyser. It runs deterministic deal math locally and returns a provider-ready research brief. The future research provider should fetch and cite:

- suburb historical performance
- rental vacancy and comparable rent data
- ABS population movement
- council planning and development activity
- state infrastructure pipeline
- nearby employment and transport nodes

The AI should summarise that research only after provider data is returned. It should not invent growth rates or projects.

## Project Structure

```text
app/                  Expo Router entry points and routes
src/ai/               AI tool registry and Responses API adapter
src/components/       Reusable UI primitives
src/data/             Seed/demo Australian data
src/layouts/          Desktop web shell and mobile tab navigator
src/lib/              Supabase client and platform integrations
src/navigation/       Shared route definitions for web and mobile
src/platform/         Platform helpers for responsive web/mobile behavior
src/screens/          Mobile screen implementations
src/services/         Business logic, pricing and subscription services
src/theme/            Theme provider and tokens
src/types/            TypeScript domain models
src/utils/            Formatting helpers
supabase/             Database schema and seed notes
```

See `docs/web-and-mobile-structure.md` for the current platform split.
