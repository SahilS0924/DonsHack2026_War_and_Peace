# ToxMap — Environmental Conflict Intelligence Platform

> "Every conflict tracker shows you where the bombs fell. ToxMap shows you what happened to the air, the water, and the land after."

Real-time environmental intelligence map of the Iran-US-Israel conflict. Takes live OSINT strike data and layers on toxic chemical plumes, CO2 emissions, satellite-detected fires, and real-time air quality — making visible what every other conflict tracker ignores.

**Hackathon:** Environmental Tech Track · March 2026
**Status:** Active development

---

## What It Does

- Plots every confirmed strike (airstrikes, missiles, drones, interceptions) on a dark military-style map
- Calculates toxic plume cones from real wind data at the exact hour of each strike (Open-Meteo)
- Shows satellite-detected fires from NASA FIRMS (updated every 10 min)
- Displays real-time air quality halos over 6 major cities (AQICN)
- Estimates CO2e per weapon type, running totals, and human equivalencies
- Counts population inside each plume polygon
- Timeline scrubber to replay the conflict day by day

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla HTML + CSS + JS (single file) |
| Map | Leaflet.js v1.9.4 |
| Map tiles | CartoDB Dark Matter |
| Strike data | iranwarlive.com/feed.json (OSINT) |
| Wind data | Open-Meteo Archive API (no key) |
| Fire data | NASA FIRMS VIIRS (key in PRD) |
| Air quality | AQICN API (token in PRD) |
| Hosting | GitHub Pages / Vercel |

No backend. No database. No build step. Single HTML file ships.

---

## Repo Structure

```
DonsHack2026_War_and_Peace/
├── README.md
├── toxmapPRD.md               # Full product requirements (read this first)
│
├── data-pipeline/
│   ├── feed/                  # IranWarLive feed fetching, parsing, CORS fallback
│   ├── weapon-profiles/       # Event type → weapon → chemicals/CO2e/radius mapping
│   └── co2-calc/              # CO2e calculation + human equivalency formatting
│
├── map-core/
│   ├── base-map/              # Leaflet init, CartoDB Dark Matter tiles, Middle East center
│   └── strike-markers/        # Pulsing colored circle markers per event type
│
├── environmental-layers/
│   ├── plume-engine/          # Open-Meteo wind fetch + plume cone geometry (Leaflet polygon)
│   ├── nasa-fires/            # NASA FIRMS CSV parse + flickering white fire dots
│   └── aqi-halos/             # AQICN fetch for 6 cities + colored AQI halo circles
│
├── ui/
│   ├── header/                # Live counters bar (events, casualties, CO2e, flights, people)
│   ├── sidebar/               # Left event list with filter buttons + click-to-fly
│   ├── detail-panel/          # Right panel: env cost, wind data, chemicals, population
│   └── timeline/              # Bottom date scrubber, filters markers + updates counters
│
└── assets/
    └── styles/                # Global CSS: scanline overlay, pulse/flicker animations, fonts
```

---

## Git Workflow — READ THIS BEFORE TOUCHING ANYTHING

### Branch Rules (enforced on GitHub)

```
main       ← protected. PRs only. No direct pushes. Ever.
staging    ← all feature branches merge here first. This is your default target.
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
git commit -m "feat: description of what you did"
git push origin feature/your-feature-name

# 4. Open a PR → staging (NOT main)
# Get it reviewed and approved before merging

# 5. staging → main is done by the repo architect only, after final review
```

### Branch naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/short-name` | `feature/plume-engine` |
| Bug fix | `fix/short-name` | `fix/cors-fallback` |
| Polish/UI | `ui/short-name` | `ui/scanline-overlay` |
| Data | `data/short-name` | `data/weapon-profiles` |

### PR checklist

Before opening a PR to staging:
- [ ] Tested locally — the map loads, your feature works
- [ ] No API keys hardcoded that aren't already in the PRD
- [ ] No `console.log` spam left in
- [ ] PR description explains what you built and how to test it

---

## Data Sources & API Keys

All keys are in `toxmapPRD.md`. Do not commit `.env` files or add new secrets to the repo.

| Source | Purpose | Key required |
|---|---|---|
| iranwarlive.com/feed.json | Strike events (OSINT) | None |
| Open-Meteo Archive API | Wind data per strike | None |
| NASA FIRMS VIIRS | Satellite fire detections | Yes (in PRD) |
| AQICN | Real-time AQI for 6 cities | Yes (in PRD) |

---

## Feature Assignments (build order from PRD section 10)

| Hours | Feature | Folder | Owner |
|---|---|---|---|
| 0–1 | Feed fetch + weapon profile mapping | `data-pipeline/` | |
| 1–3 | Leaflet map + strike markers | `map-core/` | |
| 3–5 | Wind fetch + plume cones | `environmental-layers/plume-engine/` | |
| 5–6 | NASA FIRMS fire dots | `environmental-layers/nasa-fires/` | |
| 6–7 | AQICN AQI halos | `environmental-layers/aqi-halos/` | |
| 7–8 | Left sidebar + click-to-fly | `ui/sidebar/` | |
| 8–9 | Right detail panel | `ui/detail-panel/` | |
| 9–10 | Header counters | `ui/header/` | |
| 10–11 | Timeline scrubber | `ui/timeline/` | |
| 11–14 | CSS polish, animations, scanline | `assets/styles/` | |

---

## Running Locally

No build step. Open `index.html` in a browser. If CORS blocks the live feed, the app falls back to bundled JSON data (see PRD section 8).

For live API calls during dev, use a local server to avoid browser CORS restrictions:

```bash
# Python
python3 -m http.server 8080

# Node
npx serve .
```

Then open `http://localhost:8080`.

---

## Methodology

CO2e figures based on published munitions propellant chemistry (Brown University Costs of War Project; CEOBS Conflict and Environment Observatory). Plume geometry uses real historical wind data from Open-Meteo. Population figures from UN World Urbanization Prospects 2024. Strike data from iranwarlive.com OSINT feed aggregating CENTCOM, IDF, Al Jazeera, Reuters, NYT. All estimates labelled as estimates.
