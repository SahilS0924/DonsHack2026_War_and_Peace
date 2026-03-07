# ToxMap — Environmental Conflict Intelligence Platform

> "Every conflict tracker shows you where the bombs fell. ToxMap shows you what happened to the air, the water, and the land after."

Real-time environmental intelligence map of the Iran-US-Israel conflict. Takes live OSINT strike data and layers on toxic chemical plumes, CO₂ emissions, satellite-detected fires, and real-time air quality.

**Hackathon:** Environmental Tech Track · March 2026
**Status:** Active development

---

## What It Does

- Plots every confirmed strike on a WebGL-rendered dark military map
- Calculates toxic plume cones from real wind data at the exact hour of each strike
- Shows satellite-detected fires from NASA FIRMS (updated every 10 min)
- Displays real-time air quality halos over 6 major cities
- Estimates CO₂e per weapon type with human equivalencies
- Counts population inside each plume polygon
- Timeline scrubber to replay the conflict day by day

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime / PM | **Bun** |
| Build | **Vite 6** |
| Framework | **Svelte 5** (runes) |
| Map | **MapLibre GL JS v4** (WebGL) |
| Map tiles | CartoDB Dark Matter (free, no key) |
| Styles | **Tailwind CSS v4** + custom CSS for animations |
| Strike data | iranwarlive.com/feed.json (OSINT) |
| Wind data | Open-Meteo Archive API (no key) |
| Fire data | NASA FIRMS VIIRS (key in PRD) |
| Air quality | AQICN API (token in PRD) |
| Hosting | **Vercel** (auto-deploy per branch) |

No backend. No database. No user accounts.

---

## Getting Started

```bash
# Install dependencies (Bun, not npm)
bun install

# Start dev server
bun run dev
# → http://localhost:5173

# Build for production
bun run build
```

> If you don't have Bun: `curl -fsSL https://bun.sh/install | bash`

---

## Repo Structure

```
DonsHack2026_War_and_Peace/
├── CLAUDE.md              # AI agent onboarding — read before coding
├── README.md              # This file
├── toxmapPRD.md           # Full product spec — source of truth
├── index.html             # Vite entry point
├── vite.config.js
├── package.json
│
└── src/
    ├── App.svelte         # Root — owns all global $state
    ├── main.js            # Mounts App
    │
    ├── data-pipeline/
    │   ├── feed/          # IranWarLive feed fetch + parse
    │   ├── weapon-profiles/ # Event type → chemicals/CO₂e/radius
    │   └── co2-calc/      # CO₂e calc + human equivalencies
    │
    ├── map-core/
    │   ├── base-map/      # MapLibre init, CartoDB tiles
    │   └── strike-markers/ # HTML custom markers, CSS pulse animation
    │
    ├── environmental-layers/
    │   ├── plume-engine/  # Open-Meteo wind + GeoJSON plume cones
    │   ├── nasa-fires/    # NASA FIRMS CSV → GeoJSON circle layer
    │   └── aqi-halos/     # AQICN → GeoJSON AQI halo circles
    │
    ├── ui/
    │   ├── header/        # Live counters bar
    │   ├── sidebar/       # Left event list + filters
    │   ├── detail-panel/  # Right env cost breakdown panel
    │   └── timeline/      # Bottom date scrubber
    │
    └── assets/
        └── styles/        # Tailwind v4 + custom animations
```

**Every folder has a README.md** — read it before writing code there.

---

## Git Workflow — READ BEFORE TOUCHING ANYTHING

### Branch rules (enforced on GitHub)

```
main       ← protected. PRs only from staging. Never direct push.
staging    ← integration branch. All feature PRs target here.
feature/*  ← your working branch. Branch off staging, PR back to staging.
```

### How to contribute

```bash
# 1. Always start from staging
git checkout staging
git pull origin staging

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Work, commit, push
git add <specific files>
git commit -m "feat: description"
git push origin feature/your-feature-name

# 4. Open PR → staging (NOT main)
# 5. staging → main is done by the repo architect only
```

### Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/name` | `feature/plume-engine` |
| Bug fix | `fix/name` | `fix/cors-fallback` |
| UI | `ui/name` | `ui/header` |
| Data | `data/name` | `data/weapon-profiles` |

### PR checklist
- [ ] `bun run dev` works locally — map loads, your feature works
- [ ] No `console.log` spam
- [ ] No API keys added that aren't already in the PRD
- [ ] PR description explains what you built and how to test it

---

## Feature Assignments (build order)

| Hours | Feature | Location |
|---|---|---|
| 0–1 | Feed fetch + weapon profiles | `src/data-pipeline/` |
| 1–3 | MapLibre map + strike markers | `src/map-core/` |
| 3–5 | Wind fetch + plume cones | `src/environmental-layers/plume-engine/` |
| 5–6 | NASA fire dots | `src/environmental-layers/nasa-fires/` |
| 6–7 | AQI halos | `src/environmental-layers/aqi-halos/` |
| 7–8 | Left sidebar | `src/ui/sidebar/` |
| 8–9 | Right detail panel | `src/ui/detail-panel/` |
| 9–10 | Header counters | `src/ui/header/` |
| 10–11 | Timeline scrubber | `src/ui/timeline/` |
| 11–14 | Polish + animations | `src/assets/styles/` |

---

## API Keys & Data Sources

All keys are in `toxmapPRD.md`. Do not add new secrets to the repo.

| Source | Purpose | Key |
|---|---|---|
| iranwarlive.com/feed.json | Strike events | None |
| Open-Meteo Archive API | Wind per strike | None |
| NASA FIRMS VIIRS | Satellite fires | Yes (in PRD) |
| AQICN | Real-time AQI | Yes (in PRD) |

---

## Methodology

CO₂e figures based on published munitions propellant chemistry (Brown University Costs of War Project; CEOBS). Plume geometry uses real historical wind data from Open-Meteo. Population from UN World Urbanization Prospects 2024. Strike data from iranwarlive.com OSINT feed. All estimates labelled as estimates.
