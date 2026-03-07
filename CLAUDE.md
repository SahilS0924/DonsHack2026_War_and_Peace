# CLAUDE.md — ToxMap Onboarding for AI Agents

You are working on **ToxMap**, a real-time environmental intelligence map of the Iran-US-Israel conflict. This file tells you everything you need to know before touching any code.

Read this entire file before doing anything.

---

## What ToxMap Is

ToxMap takes live OSINT military strike data and layers on the environmental damage nobody else is showing: toxic chemical plumes, CO₂ emissions, satellite-detected fires, and real-time air quality. Every bomb has a carbon cost. Every missile has a toxic footprint. ToxMap makes that visible.

**One line:** *"Every conflict tracker shows where the bombs fell. ToxMap shows what happened to the air, the water, and the land after."*

**Hackathon:** Environmental Tech Track, March 2026. 24-hour build. Judges care about impact, visual wow, and working demo.

---

## Tech Stack — March 2026

| Layer | Technology | Why |
|---|---|---|
| Runtime / package manager | **Bun** | Fastest installs, native TS, replaces Node+npm |
| Build tool | **Vite 6** | Sub-second HMR, instant dev server |
| Framework | **Svelte 5** (runes) | Compiles to ~2KB vanilla JS. `$state/$derived/$effect` are perfect for live-updating dashboards. Zero virtual DOM overhead. |
| Map | **MapLibre GL JS v4** | WebGL rendering, smooth 60fps with hundreds of fire dots, free, open source. CartoDB Dark Matter tiles have a MapLibre style JSON. Leaflet is SVG-based and shows its age in 2026. |
| Map tiles | **CartoDB Dark Matter** | Free, no key, pure black military aesthetic, MapLibre-compatible style JSON |
| Styling | **Tailwind CSS v4** | Zero config (`@import "tailwindcss"`), Lightning CSS engine, 100x faster incremental builds. Custom CSS only for animations (scanline, pulse, flicker). |
| Fonts | Google Fonts: Share Tech Mono + Orbitron | CDN, no install |
| Strike data | iranwarlive.com/feed.json | Public OSINT feed |
| Wind data | Open-Meteo Archive API | No key required |
| Fire data | NASA FIRMS VIIRS | Key: `38c7346b9d2d11a4e9a5de249c3d622` |
| Air quality | AQICN API | Token: `c1e8f5369c003f851d54fb2792e9053978ac3b9e` |
| Hosting | **Vercel** | Auto preview URL per branch (staging gets its own URL). Free. Instant deploy from GitHub. |

### Critical constraints — no exceptions
- NO backend server
- NO database
- NO user accounts
- Data-pipeline modules are pure JS/TS (no Svelte, no DOM)
- Map + UI modules are Svelte components
- All external libraries installed via `bun add`, not CDN

---

## Project Setup (one-time)

```bash
# 1. Clone and install
git clone git@github.com:SahilS0924/DonsHack2026_War_and_Peace.git
cd DonsHack2026_War_and_Peace
git checkout staging
bun install

# 2. Start dev server
bun run dev
# → http://localhost:5173
```

### `package.json` dependencies (reference)
```json
{
  "dependencies": {
    "maplibre-gl": "^4.x",
    "svelte": "^5.x"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^4.x",
    "@tailwindcss/vite": "^4.x",
    "tailwindcss": "^4.x",
    "vite": "^6.x"
  }
}
```

### `vite.config.js`
```javascript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
})
```

### `index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>TOXMAP</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

### `src/main.js`
```javascript
import './assets/styles/app.css'
import App from './App.svelte'
import { mount } from 'svelte'

const app = mount(App, { target: document.getElementById('app') })
export default app
```

---

## Repo Structure

```
DonsHack2026_War_and_Peace/
├── CLAUDE.md                          ← you are here
├── README.md                          ← human-facing overview + git workflow
├── toxmapPRD.md                       ← full product spec (source of truth)
├── index.html                         ← Vite entry point
├── vite.config.js
├── package.json
│
└── src/
    ├── App.svelte                     ← root component, owns all global $state
    ├── main.js                        ← mounts App into #app
    │
    ├── data-pipeline/                 ← pure JS modules, no Svelte, no DOM
    │   ├── feed/feed.js               ← fetch + parse iranwarlive feed.json
    │   ├── weapon-profiles/weaponProfiles.js  ← event type → chemicals/CO₂e/radius
    │   └── co2-calc/co2Calc.js        ← CO₂e midpoint calc + human equivalencies
    │
    ├── map-core/
    │   ├── base-map/MapContainer.svelte    ← MapLibre init, CartoDB tiles, map store
    │   └── strike-markers/StrikeMarkers.svelte  ← HTML custom markers, pulsing CSS
    │
    ├── environmental-layers/
    │   ├── plume-engine/PlumeEngine.svelte  ← Open-Meteo wind → GeoJSON fill layers
    │   ├── nasa-fires/NasaFires.svelte      ← NASA FIRMS CSV → GeoJSON circle layer
    │   └── aqi-halos/AqiHalos.svelte       ← AQICN → GeoJSON circle layers
    │
    ├── ui/
    │   ├── header/Header.svelte          ← top bar: live counters, $derived from events
    │   ├── sidebar/Sidebar.svelte        ← left panel: event list, filters, click-to-fly
    │   ├── detail-panel/DetailPanel.svelte  ← right panel: env cost breakdown
    │   └── timeline/Timeline.svelte      ← bottom scrubber, filters events
    │
    └── assets/
        └── styles/app.css              ← Tailwind v4 import + custom animations
```

**Every folder has a README.md** with complete implementation guide. Read it before writing code in that folder.

---

## Svelte 5 Runes Primer (critical — read this)

Svelte 5 replaced the old store/reactive system with **runes**. Use these:

```javascript
// Reactive state (replaces writable stores)
let count = $state(0)

// Derived/computed (replaces $: reactive declarations)
let double = $derived(count * 2)

// Side effects (replaces onMount + reactive statements)
$effect(() => {
  console.log('count changed:', count)
  return () => { /* cleanup */ }
})

// Component props
let { events = [], onEventClick } = $props()
```

**App.svelte owns all global state.** Child components receive data as props and emit events as callbacks. No global stores — state flows downward, events bubble up.

### Root App.svelte architecture

```svelte
<script>
  import { onMount } from 'svelte'
  import { loadFeed } from './data-pipeline/feed/feed.js'
  import { getProfile } from './data-pipeline/weapon-profiles/weaponProfiles.js'
  import { calculateCO2e } from './data-pipeline/co2-calc/co2Calc.js'
  import MapContainer from './map-core/base-map/MapContainer.svelte'
  import StrikeMarkers from './map-core/strike-markers/StrikeMarkers.svelte'
  import PlumeEngine from './environmental-layers/plume-engine/PlumeEngine.svelte'
  import NasaFires from './environmental-layers/nasa-fires/NasaFires.svelte'
  import AqiHalos from './environmental-layers/aqi-halos/AqiHalos.svelte'
  import Header from './ui/header/Header.svelte'
  import Sidebar from './ui/sidebar/Sidebar.svelte'
  import DetailPanel from './ui/detail-panel/DetailPanel.svelte'
  import Timeline from './ui/timeline/Timeline.svelte'

  let allEvents = $state([])
  let filteredEvents = $state([])
  let selectedEvent = $state(null)
  let map = $state(null)   // MapLibre map instance, set by MapContainer

  onMount(async () => {
    const raw = await loadFeed()
    allEvents = raw.map(e => ({
      ...e,
      profile: getProfile(e.type),
      co2e_estimate: calculateCO2e(getProfile(e.type)),
    }))
    filteredEvents = allEvents

    // Polling
    setInterval(async () => {
      const fresh = await loadFeed()
      allEvents = fresh.map(e => ({
        ...e,
        profile: getProfile(e.type),
        co2e_estimate: calculateCO2e(getProfile(e.type)),
      }))
    }, 30 * 60 * 1000)
  })
</script>

<div class="fixed inset-0 bg-[#0a0a0a] overflow-hidden font-mono">
  <!-- Map is the base layer, fills entire screen -->
  <MapContainer bind:map />

  <!-- Map layers rendered inside MapContainer via props -->
  {#if map}
    <PlumeEngine {map} events={filteredEvents} />
    <AqiHalos {map} />
    <NasaFires {map} />
    <StrikeMarkers {map} events={filteredEvents} onMarkerClick={(e) => selectedEvent = e} />
  {/if}

  <!-- UI panels float on top -->
  <Header events={filteredEvents} />
  <Sidebar events={filteredEvents} {map} onEventClick={(e) => selectedEvent = e} />
  <DetailPanel event={selectedEvent} onClose={() => selectedEvent = null} />
  <Timeline allEvents={allEvents} onFilter={(f) => filteredEvents = f} />

  <!-- Scanline overlay — top of everything -->
  <div class="scanline-overlay" aria-hidden="true"></div>
</div>
```

---

## MapLibre GL JS — Critical Differences from Leaflet

**IMPORTANT:** MapLibre uses `[longitude, latitude]` order everywhere. Leaflet used `[lat, lng]`. This is the most common mistake.

```javascript
// WRONG (Leaflet style):
map.flyTo([35.6892, 51.3890])  // [lat, lng]

// CORRECT (MapLibre style):
map.flyTo({ center: [51.3890, 35.6892] })  // [lng, lat]
```

### Map initialization
```javascript
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const map = new maplibregl.Map({
  container: containerElement,  // DOM element, not string ID
  style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  center: [50, 32],   // [lng, lat] — center of Middle East
  zoom: 5,
  attributionControl: false,
})
```

### Adding data layers (GeoJSON pattern)
```javascript
// Wait for map to load before adding layers
map.on('load', () => {

  // 1. Add a source (data container)
  map.addSource('plumes', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] }  // start empty
  })

  // 2. Add a layer (renderer)
  map.addLayer({
    id: 'plumes-fill',
    type: 'fill',
    source: 'plumes',
    paint: {
      'fill-color': 'rgba(255, 100, 0, 0.12)',
      'fill-outline-color': 'rgba(255, 100, 0, 0.6)',
    }
  })

  // 3. Update data later (reactive to $state changes)
  map.getSource('plumes').setData({
    type: 'FeatureCollection',
    features: plumeFeatures
  })
})
```

### Custom HTML markers (for CSS animations)
```javascript
// Use HTML markers for strike markers so CSS pulse animations work
const el = document.createElement('div')
el.className = 'strike-marker'
el.style.cssText = `width: 12px; height: 12px; background: ${color}; border-radius: 50%;`

const marker = new maplibregl.Marker({ element: el })
  .setLngLat([event.lng, event.lat])  // [lng, lat]!
  .addTo(map)

el.addEventListener('click', () => onMarkerClick(event))
```

### Fly to a location
```javascript
map.flyTo({
  center: [event.lng, event.lat],  // [lng, lat]
  zoom: 8,
  duration: 1000,
})
```

---

## Data Sources

### 1. IranWarLive OSINT Feed
- **URL:** `https://iranwarlive.com/feed.json`
- **Auth:** None
- **Updates:** Every 30 minutes
- **Filter rule:** Only events where both `_osint_meta.coordinates.lat` AND `lng` are non-null (~35 of 44)
- **CORS fallback:** Try live fetch first. If it fails, use `BUNDLED_FEED_DATA` (paste the JSON as a JS const). Demo must work offline.

### 2. Open-Meteo Wind Archive
- **URL:** `https://archive-api.open-meteo.com/v1/archive?latitude={LAT}&longitude={LNG}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&hourly=wind_speed_10m,wind_direction_10m`
- **Auth:** None
- **Logic:** Extract UTC hour from strike timestamp → index into `hourly.time` → get wind speed + direction

### 3. NASA FIRMS Satellite Fires
- **URL:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/38c7346b9d2d11a4e9a5de249c3d622/VIIRS_SNPP_NRT/44,24,64,40/7`
- **Returns:** CSV. Parse lat/lng. Render as GeoJSON circle layer.
- **Updates:** Every 10 minutes

### 4. AQICN Real-Time AQI
- **Token:** `c1e8f5369c003f851d54fb2792e9053978ac3b9e`
- **Cities:** tehran, baghdad, kuwait, beirut, dubai, tel-aviv
- **URL:** `https://api.waqi.info/feed/{city}/?token={TOKEN}`
- **Response:** `data.aqi` + `data.city.geo` = [lat, lng]
- **Updates:** Every hour

---

## Weapon Profiles

| Event Type | Toxic Chemicals | CO₂e Range (kg) | Impact Radius |
|---|---|---|---|
| `Ballistic Missile Strike` | UDMH, NO₂, HCN, NOx | 2,000–8,000 | 5–15 km |
| `Missile attack (intercepted)` | HCl, Al₂O₃, NOx | 300–600 | 0.5–1 km |
| `Missile Strike` | NOx, Black Carbon, PM2.5 | 500–2,000 | 3–8 km |
| `Airstrike` / `Air Strike` | NOx, Black Carbon, PM2.5, CO | 500–3,000 | 2–5 km |
| `Airstrikes/Bombardment` | NOx, SO₂, PM2.5, CO | 5,000–20,000 | 5–15 km |
| `Drone strike` / `Drone Attack` | CO, VOCs, PM10, NOx | 80–200 | 0.5–1 km |
| `Naval Strike` | HFO, SO₂, Benzene, PAHs | 2,000–15,000 | 3–10 km |
| `Ground Incursion` | Diesel PM, Lead, NOx | 50–150 | 1–2 km |
| `Interception` / `Defensive Fire` | HCl, Al₂O₃, NOx | 100–300 | 0.5 km |

CO₂e estimate = midpoint of range. Always label as estimates.

---

## Visual Design — Non-Negotiable

| Rule | Value |
|---|---|
| Background | `#0a0a0a` everywhere |
| Font (body) | `Share Tech Mono` — apply via Tailwind `font-mono` after setting it as the mono font |
| Font (numbers/headers) | `Orbitron` |
| Primary text | `#ccc` |
| Muted text | `#555` or `#888` |
| Airstrikes | `#ff2d2d` (red) |
| Missiles | `#ff6b00` (orange) |
| Drones | `#ffd700` (yellow) |
| Interceptions | `#00ff88` (green) |
| Plumes | `rgba(255, 100, 0, 0.12)` fill, `rgba(255, 100, 0, 0.6)` border |
| Fire dots | `#ffffff` flickering |
| Border radius | `0` — no rounded corners ever |
| Gradients | None |
| Shadows | None |
| Vibe | Cold. Clinical. Military situation room. |

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER BAR — live counters, always visible (z:1000)        │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  SIDEBAR     │      MAP (MapLibre)          │  DETAIL       │
│  (z:400)     │      full screen (z:1)       │  PANEL        │
│  280px wide  │      WebGL canvas            │  (z:500)      │
│              │                              │  320px wide   │
├──────────────┴──────────────────────────────┴───────────────┤
│  TIMELINE SCRUBBER — bottom (z:200)                         │
└─────────────────────────────────────────────────────────────┘
```

Map centered on `[50, 32]` (lng, lat), zoom 5.

---

## Map Layer Order (bottom → top)

Add layers to MapLibre in this order so markers sit on top:
1. Plume cones (GeoJSON fill layer — largest, drawn first)
2. AQI halos (GeoJSON circle layer — large transparent rings)
3. NASA fire dots (GeoJSON circle layer — many small points)
4. Strike markers (HTML custom markers — on top, clickable)

---

## Data Flow

```
ON LOAD:
  loadFeed()                → ~35 raw events
  getProfile(event.type)    → enriches each event with weapon profile
  calculateCO2e(profile)    → adds co2e_estimate (kg) to each event
  allEvents = $state(...)   → Svelte reactive state in App.svelte

  MapContainer mounts       → MapLibre map instance
  map.on('load', ...)       → PlumeEngine, NasaFires, AqiHalos add their layers
  StrikeMarkers renders     → HTML markers added for each event

  Header, Sidebar, Timeline → receive filteredEvents as props, auto-update via Svelte reactivity

ON TIMELINE DRAG:
  filteredEvents = $state(subset of allEvents)
  → StrikeMarkers re-renders (markers update)
  → Sidebar re-renders (cards update)
  → Header re-derives totals ($derived)

ON MARKER/CARD CLICK:
  selectedEvent = $state(event)
  → DetailPanel receives event as prop → slides in

POLLING:
  Every 30 min → re-fetch strikes → allEvents updates → all components re-render
  Every 10 min → NasaFires re-fetches → updates its GeoJSON source
  Every 1 hour → AqiHalos re-fetches → updates its GeoJSON source
```

---

## Key Cities (plume population calculation)

```javascript
export const CITIES = [
  { name: "Tehran",       lat: 35.6892, lng: 51.3890, population: 9_200_000 },
  { name: "Baghdad",      lat: 33.3152, lng: 44.3661, population: 7_200_000 },
  { name: "Tel Aviv",     lat: 32.0853, lng: 34.7818, population: 4_300_000 },
  { name: "Beirut",       lat: 33.8938, lng: 35.5018, population: 2_200_000 },
  { name: "Dubai",        lat: 25.2048, lng: 55.2708, population: 3_400_000 },
  { name: "Kuwait City",  lat: 29.3759, lng: 47.9774, population: 3_100_000 },
  { name: "Riyadh",       lat: 24.7136, lng: 46.6753, population: 7_600_000 },
  { name: "Doha",         lat: 25.2854, lng: 51.5310, population: 2_400_000 },
  { name: "Manama",       lat: 26.2235, lng: 50.5876, population:   650_000 },
  { name: "Abu Dhabi",    lat: 24.4539, lng: 54.3773, population: 1_500_000 },
  { name: "Tabriz",       lat: 38.0800, lng: 46.2919, population: 1_700_000 },
  { name: "Isfahan",      lat: 32.6539, lng: 51.6660, population: 2_200_000 },
  { name: "Shiraz",       lat: 29.5918, lng: 52.5836, population: 1_900_000 },
  { name: "Mashhad",      lat: 36.2605, lng: 59.6168, population: 3_400_000 },
  { name: "Karaj",        lat: 35.8327, lng: 50.9915, population: 1_600_000 },
]
```

---

## Git Workflow — Follow Exactly

```
main     ← protected. Never touch. PRs from staging only.
staging  ← your target. All feature PRs merge here first.
feature/ ← your working branch. Always branch off staging.
```

```bash
# Start work
git checkout staging && git pull origin staging
git checkout -b feature/your-feature-name

# Done
git add <specific files>
git commit -m "feat: what you did"
git push origin feature/your-feature-name
# → open PR to staging, not main
```

Branch naming: `feature/plume-engine`, `fix/cors-fallback`, `ui/header`, `data/weapon-profiles`

Never push directly to `main` or `staging`.

---

## Common Mistakes

- **MapLibre is `[lng, lat]`, not `[lat, lng]`.** This will bite you. Every coordinate in MapLibre is longitude first.
- **Wait for `map.on('load', ...)` before adding sources/layers.** Adding layers before the style loads throws errors.
- **Use `map.getSource(id).setData(newData)` to update layers**, not removing and re-adding them.
- **Data pipeline modules are pure JS.** No Svelte imports. No DOM access. They return plain objects.
- **Don't use Svelte stores.** Use runes (`$state`, `$derived`, `$effect`) — stores are the old Svelte 4 pattern.
- **Don't add `border-radius`, gradients, or white backgrounds** to any UI element.
- **Don't crash on API failure.** Wrap all fetches in try/catch, fall back silently.

---

## Methodology Disclaimer (required in detail panel)

> *"CO₂e figures are estimates based on published munitions propellant chemistry (Brown University Costs of War Project; CEOBS Conflict and Environment Observatory). Plume geometry uses real historical wind data from Open-Meteo. Population figures from UN World Urbanization Prospects 2024. Strike data from iranwarlive.com OSINT feed aggregating CENTCOM, IDF, Al Jazeera, Reuters, NYT. All estimates labelled as such."*

Always append to CO₂e numbers: *"munitions only — real figure significantly higher"*

---

## Full PRD

`toxmapPRD.md` is the source of truth. It has all API URLs, keys, plume geometry math, UI wireframes, build order, and demo script. If this file conflicts with the PRD, the PRD wins.
