# Spinzy

FlexCar promotional spin wheel — Vite + TypeScript static app, deployed on GitHub Pages (`spinzy.patriarxis.com`).

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

## Deploy (GitHub Pages)

1. `npm run build`
2. Publish the `dist/` folder to the `main` branch Pages source (or your existing Pages workflow).
3. `public/CNAME` is copied into `dist` so the custom domain stays `spinzy.patriarxis.com`.

`vite.config.ts` uses `base: '/'` for the custom domain.

## Settings (prize integrity)

Outcomes are chosen **in the browser** with weighted `Math.random()`. That is fine for a promo demo, **not** for high-value prizes.

- **Development:** Settings button is visible (`import.meta.env.DEV`).
- **Production:** Settings is **hidden** unless you build with:

```bash
VITE_ENABLE_SETTINGS=true npm run build
```

Do not enable public Settings if odds must stay trusted. For real prizes, use a server-side draw.

## Project layout

```text
src/           TypeScript modules (wheel, settings, pacman, audio, …)
public/assets  Images + self-hosted sounds
dist/          Build output (GitHub Pages)
```

## Assets

Required under `public/assets/`:

- `images/prizes/*.webp`
- `images/wheel-prizes/*.webp`
- `images/suv-runner.png` + chrome SVGs
- `sounds/*.wav`
