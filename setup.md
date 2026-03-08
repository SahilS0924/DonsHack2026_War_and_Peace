# ToxMap — Setup Guide

> Get the UI running in under 5 minutes.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| **Bun** | latest | `curl -fsSL https://bun.sh/install \| bash` |
| **Git** | any | pre-installed on macOS/Linux |

> **Do not use npm or yarn.** The lockfile is `bun.lock` — only Bun reads it correctly.

Verify Bun is installed:
```bash
bun --version
# should print 1.x.x or higher
```

---

## 1. Clone & Install

```bash
git clone git@github.com:SahilS0924/DonsHack2026_War_and_Peace.git
cd DonsHack2026_War_and_Peace
bun install
```

`bun install` takes ~5 seconds. It installs:
- Svelte 5
- MapLibre GL JS v4
- Tailwind CSS v4
- Vite 6

---

## 2. Start Dev Server

```bash
bun run dev
```

Open **http://localhost:5173**

---

## 3. What You Should See

On first load (~3–5 seconds for external API calls):

1. **Black background** fills the screen immediately
2. **CartoDB Dark Matter map tiles** load — dark gray Middle East map centered on Iran/Iraq
3. **Colored strike markers** appear (red = airstrikes, orange = missiles, yellow = drones, green = interceptions)
4. **Header bar** at top shows live event count, casualty total, CO₂e estimate
5. **Left sidebar** lists ~39 event cards with filter buttons (ALL / AIR / MISS / DRONE / INTER)
6. **Bottom timeline** scrubber spans the conflict dates

After 10–30 seconds (background fetches):
- **White flickering dots** = NASA satellite fire detections
- **Colored halos** around 6 cities = real-time AQI rings
- **Orange plume cones** = toxic dispersion from wind data

---

## 4. Verify It's Working

Open browser DevTools → Network tab:

| Filter | What you should see |
|---|---|
| `cartocdn` | `.mvt` / `.pbf` tile requests returning 200 |
| `iranwarlive` | `feed.json` returning 200 (or silent fallback to bundled data) |
| `firms.modaps` | CSV response with fire coordinates |
| `waqi.info` | JSON with `data.aqi` per city |
| `open-meteo` | Wind archive JSON per strike |

Console should show **no red errors**. `[MapLibre error]` lines mean a tile/style issue — check your internet connection.

---

## 5. Switching Branches

Work always starts from `staging`:

```bash
git checkout staging
git pull origin staging
git checkout -b feature/your-feature-name
```

Never commit directly to `staging` or `main`. Open a PR to `staging` when done.

---

## 6. Build for Production

```bash
bun run build
# output → dist/

bun run preview
# serves dist/ locally at http://localhost:4173
```

---

## Troubleshooting

**Map is solid black / no tiles**
- Hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
- Check console for `[MapLibre error]`
- Check Network tab for `cartocdn` requests — if blocked, check firewall/VPN

**`bun install` fails**
- Make sure Bun is in your PATH: `which bun`
- Re-run the install script: `curl -fsSL https://bun.sh/install | bash` then open a new terminal

**Port 5173 already in use**
```bash
bun run dev -- --port 5174
```

**Events not loading / sidebar empty**
- The live feed (`iranwarlive.com/feed.json`) may be down — the app silently falls back to bundled data
- Check `src/data-pipeline/feed/feed.js` → `BUNDLED_FEED_DATA` is the offline fallback

**Plume cones not appearing**
- Open-Meteo fetches are batched and staggered — wait 15–30 seconds after markers appear
- Check Network tab for `open-meteo.com` requests

---

## Key Files

| File | Purpose |
|---|---|
| `src/App.svelte` | Root — owns all global state |
| `src/map-core/base-map/MapContainer.svelte` | MapLibre init |
| `src/data-pipeline/feed/feed.js` | Strike data fetch |
| `vite.config.js` | Build config |
| `CLAUDE.md` | Full technical spec (AI agent onboarding) |
| `toxmapPRD.md` | Product requirements — source of truth |