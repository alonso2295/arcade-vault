# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Non-standard Next.js version

This project uses **Next.js 16.2.12**, which has breaking changes vs. the Next.js you were trained on — APIs, conventions, and file structure may differ from your training data. **Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`** (organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`). Heed any deprecation notices found there.

Two conventions that already bite in this repo:

- Route `params` is a `Promise` and must be awaited (see `app/game/[id]/page.tsx`).
- Middleware lives in **`proxy.ts`** at the repo root, exporting `proxy()` — not `middleware.ts` / `middleware()`.

## Project

Arcade Vault — a retro-arcade platform for playing games online and competing for the high score. **All UI copy is in Spanish**; keep it that way when adding features.

Stack: Next.js 16.2.12 (App Router) · React 19.2.4 · TypeScript · Tailwind CSS v4 · Supabase · Resend.

Nine specs have been implemented (`specs/01`–`09`): app shell and routing, game detail + Hall of Fame, landing page, contact email, Supabase integration, and three playable games.

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # eslint
```

There is **no test runner configured** in this project. Verify changes by running the app.

## Routes (`app/`)

| Route | Notes |
|---|---|
| `/` | Redirects to `/games` |
| `/games` | Landing page |
| `/biblioteca` | Client; search + category filter over `GAMES` |
| `/jugables` | Auto-lists every game with `playable: true` |
| `/game/[id]` | Server Component: game detail + leaderboard (top 10) |
| `/game/[id]/play` | Dispatches to the player component for that game |
| `/hall-of-fame` | Client; one tab per game, top 12 |
| `/about` | Includes the contact form |
| `/auth` | Renders `AuthForm` (mock session — see below) |

`app/layout.tsx` sets the fonts (Press Start 2P + JetBrains Mono), `Nav`, and the footer.

## Game catalog — `lib/games.ts`

`GAMES: Game[]` is the **single source of truth** for the catalog. Every listing page derives from it; `/game/[id]` looks up by `id` and calls `notFound()` on a miss.

```ts
interface Game {
  id: string;            // kebab-case slug, must be unique
  title: string;
  short: string; long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string;         // CSS class defined in app/globals.css
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number; plays: string;
  playable?: boolean;
}
```

**The `playable: true` flag is the key convention.** Setting it automatically:

- lists the game on `/jugables`,
- switches `app/game/[id]/page.tsx` and `app/hall-of-fame/page.tsx` from mock data to real Supabase scores.

Without the flag, leaderboards use the deterministic mock generator `seededScores(seed, count)` from the same file. Games are playable today: `asteroides`, `caida` (Tetris), `arkanoide`. The other seven catalog entries are showcase-only.

## Adding a playable game

Strict engine/component split — replicate it exactly. Only **five** touch points:

1. Entry in `GAMES` (`lib/games.ts`) with `playable: true`.
2. A `.cover-<id>` class in `app/globals.css`.
3. Headless engine at `lib/games/<id>/engine.ts` — pure logic, no React. Exports `create<Name>Game(canvas, onStateChange) => { destroy() }` plus its state type.
4. Client component at `components/games/<Name>Player.tsx` — `"use client"`, canvas ref + `useEffect` mount/destroy, React HUD, game-over overlay linking back to `/game/<id>`, and a `useRef` guard so `saveScore` fires only once per run.
5. An `if (id === "<id>")` branch in `app/game/[id]/play/page.tsx` (a manual if-chain, not a map; unknown ids fall through to a "Próximamente" placeholder).

Static assets go under `public/games/<id>/` (see `arkanoide`: spritesheet + sounds). Source material for ports lives in `references/templates/started-games/`.

**Never edit these per-game — they are already generalized:** `lib/supabase/scores.ts`, `app/game/[id]/page.tsx`, `app/hall-of-fame/page.tsx`, `app/jugables/page.tsx`.

## Supabase

- Clients: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (async, uses `cookies()`), `lib/supabase/middleware.ts` (`updateSession`, invoked from `proxy.ts`).
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.local.example`).
- **One table, `scores`**, shared by every game: `id`, `game_id`, `player_name`, `score`, `created_at`. Filter by `game_id` — do not create per-game tables.
- API in `lib/supabase/scores.ts`: `saveScore({ gameId, playerName, score })` and `getTopScores(gameId, limit, client?)`. Score writes go straight from the browser client to Supabase.
- There are **no migration files in the repo**; the schema is managed remotely through the Supabase MCP server configured in `.mcp.json`.

## Session and auth

Auth is still a **mock** — do not assume Supabase Auth. `lib/session.ts` stores `{ name }` in `localStorage` under `av_user`; `hooks/useSession.ts` wraps it; `components/AuthForm.tsx` feeds it. The OAuth buttons are decorative and no route is gated. `proxy.ts` does refresh the Supabase cookie session, so the plumbing for real auth exists.

## Email

`lib/actions/contact.ts` is a Server Action (`"use server"`) that validates input and sends notification + confirmation emails via Resend. Consumed by `components/ContactForm.tsx` on `/about`. It is the only server-side mutation path — there are **no API routes** in this project.

## Shared components and hooks

`Nav`, `GameCard`, `MiniGameCard`, `FeatureIcon`, `FloatingSilhouettes`; `hooks/useReveal.ts` (on-scroll reveal animations). Reuse these before writing new ones.

## Styling

Tailwind CSS v4 via `@tailwindcss/postcss` — no `tailwind.config`, v4 config lives in CSS. Styling is hybrid: Tailwind utilities in newer components plus a large hand-written neon system in `app/globals.css` (`av-*`, `neon-*`, `cover-*`, `btn`, `chip`, and CSS vars `--magenta`, `--cyan`, `--line`, `--ink-faint`), often applied via inline `style` objects ported from `references/templates/*.jsx`.

ESLint uses flat config (`eslint.config.mjs`) extending `eslint-config-next`. Path alias `@/*` maps to the project root.

## Skills

- **`/frontend-design` — always use it when designing user interfaces.**
- **`/new-game`** (`.claude/skills/new-game/SKILL.md`, authored in this repo) — the correct entry point for adding a game, instead of generic `/spec`. It produces a spec that covers only the five touch points above, because the leaderboard infrastructure is already generic.

## Spec-driven workflow

Specs live in `specs/NN-slug.md`. Use `/spec` to write one, then `/spec-impl` to implement it. Installed via `npx skills@latest add Klerith/fernando-skills`.

`specs/.spec-config.yml` sets `AutoCreateBranch: true`, so `/spec-impl` creates and switches to branch `spec-NN-slug` automatically. The established git convention is **one branch and one PR per spec**, merged into `main`.

Useful references when following an existing pattern: `specs/06-asteroids-player.md` (engine/component) and `specs/07-leaderboard-and-playable-games.md` (real leaderboard).
