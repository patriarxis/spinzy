# Spinzy

FlexCar promotional spin wheel — Vite + TypeScript static app, deployed on Vercel.

## Setup

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local development server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Preview the production build |

## Deploy (Vercel)

1. Connect the repo to Vercel (framework preset: Vite).
2. Build command: `npm run build`
3. Output directory: `dist`

`vite.config.ts` uses `base: '/'` for root-domain deploy.

## Project layout

```text
src/           TypeScript modules (wheel, settings, pacman, audio, …)
public/assets  Images + self-hosted sounds
dist/          Build output (Vercel)
```

## Assets

Required under `public/assets/`:

- `images/prizes/*.webp`
- `images/wheel-prizes/*.webp`
- `images/suv-runner.png` + chrome SVGs
- `sounds/*.wav`
