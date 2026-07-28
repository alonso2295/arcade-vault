# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Non-standard Next.js version

This project uses **Next.js 16.2.12**, which has breaking changes vs. the Next.js you were trained on — APIs, conventions, and file structure may differ from your training data. **Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`** (organized as `01-app/`, `02-pages/`, `03-architecture/`, `04-community/`). Heed any deprecation notices found there.

## Project

Arcade Vault — a platform for playing games online and competing for the highest score. Currently a fresh `create-next-app` scaffold (App Router, TypeScript, Tailwind CSS v4) with no custom features implemented yet.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint (flat config via eslint.config.mjs)
```

There is no test runner configured in this project yet.

## Architecture

- App Router lives under `app/`: `app/layout.tsx` (root layout), `app/page.tsx` (home page), `app/globals.css` (Tailwind entrypoint).
- Path alias `@/*` maps to the project root (see `tsconfig.json`).
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss` (no `tailwind.config` — v4 uses CSS-based config in `globals.css`).
- ESLint uses the flat-config format (`eslint.config.mjs`), extending `eslint-config-next` (core-web-vitals + typescript).

## Spec-driven workflow

This repo follows spec-driven development using the `/spec` and `/spec-impl` workflow from [Klerith/fernando-skills](https://github.com/Klerith/fernando-skills), installed via:

```bash
npx skills@latest add Klerith/fernando-skills
```

Use `/spec` to produce a spec before implementing a feature, and `/spec-impl` to implement against an existing spec.
