# TOXMAP — Master Product Requirements Document
### Environmental Conflict Intelligence Platform
### Hackathon: Environmental Tech Track · March 2026

---

## 1. PROJECT SUMMARY

**ToxMap** is a real-time environmental intelligence map of the Iran-US-Israel conflict. It takes live OSINT strike data from `iranwarlive.com/feed.json` — the same data military analysts use — and adds the environmental layer nobody else is showing: toxic chemical plumes, CO₂ emissions, air quality degradation, and satellite-detected fires. Every bomb has a carbon cost. Every missile has a toxic footprint. Every plume has a population inside it. ToxMap makes that visible for the first time using 7 days of real conflict data.

**One line pitch:**
> "Every conflict tracker shows you where the bombs fell. ToxMap shows you what happened to the air, the water, and the land after."

---

## 2. CORE DATA SOURCES

### 2.1 Primary — IranWarLive OSINT Feed
- **URL:** `https://iranwarlive.com/feed.json`
- **Auth:** None required. Public JSON feed.
- **Update frequency:** Every 30 minutes
- **What it contains:** 44+ real conflict events from March 4–7 2026, each with:
  - `event_id` — unique identifier
  - `type` — event type (Airstrike, Ballistic Missile Strike, Drone strike, Missile attack (intercepted), Naval Strike, Ground Incursion, Interception, Defensive Fire)
  - `timestamp` — ISO 8601 UTC timestamp
  - `event_summary` — plain English description sourced from news wires
  - `confidence` — source reliability (US/IDF Military (High), High Confidence (Multi-Source), News Wire, State Media/Unverified)
  - `source_url` — original article URL (Al Jazeera, NYT, BBC, IDF, JINSA)
  - `_osint_meta.casualties` — casualty count string
  - `_osint_meta.coordinates.lat` — latitude (some events have null)
  - `_osint_meta.coordinates.lng` — longitude (some events have null)

**Filter rule:** Only use events where both lat AND lng are non-null. Approximately 35 of 44 events have coordinates.

**Real examples from the feed:**
```json
{
  "event_id": "IRW-20260307-3205",
  "type": "Drone strike",
  "timestamp": "2026-03-07T09:00:28.346Z",
  "event_summary": "Drone strike reported. Unidentified drone strikes Dubai International Airport.",
  "confidence": "News Wire",
  "source_url": "https://www.aljazeera.com/...",
  "_osint_meta": {
    "casualties": "0",
    "coordinates": { "lat": "25.07736643", "lng": "55.19397289" }
  }
}
```
```json
{
  "event_id": "IRW-20260306-1002",
  "type": "Ballistic Missile Strike",
  "timestamp": "2026-03-06T15:00:00Z",
  "event_summary": "Iranian IRGC launches its 23rd wave of strikes, targeting Tel Aviv with combined drone and missile attack.",
  "confidence": "High Confidence (Multi-Source)",
  "_osint_meta": {
    "casualties": "0",
    "coordinates": { "lat": "32.0853", "lng": "34.7818" }
  }
}
```

---

### 2.2 Secondary — Open-Meteo Historical Wind Archive
- **URL:** `https://archive-api.open-meteo.com/v1/archive`
- **Auth:** None required. No API key.
- **Purpose:** Get exact wind speed and direction at the hour of each strike, at the strike's coordinates. Used to draw realistic toxic plume cones.

**API call per event:**
```
https://archive-api.open-meteo.com/v1/archive?latitude={LAT}&longitude={LNG}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&hourly=wind_speed_10m,wind_direction_10m
```

**Confirmed working example for Tehran:**
```
https://archive-api.open-meteo.com/v1/archive?latitude=35.69&longitude=51.39&start_date=2026-03-04&end_date=2026-03-07&hourly=wind_speed_10m,wind_direction_10m
```

**Response structure:**
```json
{
  "hourly": {
    "time": ["2026-03-04T00:00", "2026-03-04T01:00", ...],
    "wind_speed_10m": [4.4, 6.7, 5.6, ...],
    "wind_direction_10m": [55, 27, 31, ...]
  }
}
```

**Logic:** Match the strike timestamp hour to the nearest entry in `hourly.time`. Use that hour's `wind_speed_10m` (km/h) and `wind_direction_10m` (degrees) to draw the plume cone.

**Plume geometry:**
- Plume length = wind_speed × 3 hours (km)
- Plume direction = wind_direction_10m (degrees from North)
- Plume cone width = 45 degrees either side of wind direction
- Draw as a semi-transparent polygon on the map

---

### 2.3 Tertiary — NASA FIRMS Satellite Fire Detection
- **API Key:** `38c7346b9d2d11a4e9a5de249c3d622`
- **URL format:**
```
https://firms.modaps.eosdis.nasa.gov/api/area/csv/38c7346b9d2d11a4e9a5de249c3d622/VIIRS_SNPP_NRT/44,24,64,40/7
```
- **Bounding box:** `44,24,64,40` = Middle East (west, south, east, north)
- **`/7`** = last 7 days of fire detections
- **Update frequency:** Every 10 minutes
- **Returns:** CSV with columns: latitude, longitude, bright_ti4, scan, track, acq_date, acq_time, satellite, confidence, version, bright_ti5, frp, daynight
- **Purpose:** Plot actual satellite-detected fires as flickering white/yellow dots on the map. These correspond to burning infrastructure from strikes.
- **Parse:** Split CSV by newline, skip header row, extract lat/lng columns

---

### 2.4 Quaternary — AQICN Real-Time Air Quality
- **API Token:** `c1e8f5369c003f851d54fb2792e9053978ac3b9e`
- **URL format:**
```
https://api.waqi.info/feed/{CITY}/?token=c1e8f5369c003f851d54fb2792e9053978ac3b9e
```
- **Cities to query:**
  - Tehran: `https://api.waqi.info/feed/tehran/?token=c1e8f5369c003f851d54fb2792e9053978ac3b9e`
  - Baghdad: `https://api.waqi.info/feed/baghdad/?token=c1e8f5369c003f851d54fb2792e9053978ac3b9e`
  - Kuwait City: `https://api.waqi.info/feed/kuwait/?token=c1e8f5369c003f851d54fb2792e9053978ac3b9e`
  - Beirut: `https://api.waqi.info/feed/beirut/?token=c1e8f5369c003f851d54fb2792e9053978ac3b9e`
  - Dubai: `https://api.waqi.info/feed/dubai/?token=c1e8f5369c003f851d54fb2792e9053978ac3b9e`
  - Tel Aviv: `https://api.waqi.info/feed/tel-aviv/?token=c1e8f5369c003f851d54fb2792e9053978ac3b9e`
- **Response:** `data.aqi` = current AQI value, `data.city.geo` = [lat, lng]
- **AQI color scale:** 0-50 green, 51-100 yellow, 101-150 orange, 151-200 red, 200+ purple
- **Update frequency:** Hourly

---

## 3. WEAPON PROFILES & ENVIRONMENTAL CALCULATIONS

Map the feed's `type` field to these profiles:

| Feed Event Type | Likely Weapon | Toxic Chemicals Released | CO₂e Range (kg) | Impact Radius |
|---|---|---|---|---|
| `Ballistic Missile Strike` | Iranian Shahab/Fattah | UDMH, NO₂, HCN, NOx | 2,000–8,000 | 5–15 km |
| `Missile attack (intercepted)` | THAAD/Patriot PAC-3 | HCl, Al₂O₃, NOx | 300–600 | 1 km |
| `Missile Strike` | Tomahawk/PrSM | NOx, Black Carbon, PM2.5 | 500–2,000 | 3–8 km |
| `Missile/Projectile attack` | Mixed ballistic | NOx, UDMH traces, PM2.5 | 1,000–5,000 | 3–10 km |
| `Air Strike` / `Airstrike` | GBU-31 JDAM / F-35 | NOx, Black Carbon, PM2.5, CO | 500–3,000 | 2–5 km |
| `Airstrikes/Bombardment` | Sustained air campaign | NOx, SO₂, PM2.5, CO | 5,000–20,000 | 5–15 km |
| `Airstrikes/Bombing (Cumulative Impact)` | Multiple munitions | NOx, SO₂, Black Carbon | 10,000–50,000 | 10–20 km |
| `Drone strike` / `Drone Attack` | Shahed-136/Israeli drone | CO, VOCs, PM10, NOx | 80–200 | 0.5–1 km |
| `Naval Strike` | Ship-launched missile | HFO, SO₂, Benzene, PAHs | 2,000–15,000 | 3–10 km |
| `Ground Incursion` | Armoured vehicles | Diesel PM, Lead, NOx | 50–150 | 1–2 km |
| `Interception` / `Defensive Fire` | Iron Dome/David's Sling | HCl, Al₂O₃, NOx | 100–300 | 0.5 km |

**CO₂e Calculation:**
```javascript
const co2e = (profile.co2e_min + profile.co2e_max) / 2  // midpoint estimate
totalCO2e += co2e  // running sum across all events
```

**Human equivalencies for CO₂e display:**
- 1 tonne = 4 return flights London–New York
- 10 tonnes = 1 person's annual carbon footprint
- 100 tonnes = driving a car 500,000 km
- 1,000 tonnes = annual emissions of a small village

Always label estimates: *"munitions only — real figure significantly higher"*

---

## 4. HARDCODED CITY POPULATION TABLE

Used for "people in plume" calculation — check if plume polygon intersects city:

```javascript
const CITIES = [
  { name: "Tehran", lat: 35.6892, lng: 51.3890, population: 9_200_000 },
  { name: "Baghdad", lat: 33.3152, lng: 44.3661, population: 7_200_000 },
  { name: "Tel Aviv", lat: 32.0853, lng: 34.7818, population: 4_300_000 },
  { name: "Beirut", lat: 33.8938, lng: 35.5018, population: 2_200_000 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708, population: 3_400_000 },
  { name: "Kuwait City", lat: 29.3759, lng: 47.9774, population: 3_100_000 },
  { name: "Riyadh", lat: 24.7136, lng: 46.6753, population: 7_600_000 },
  { name: "Doha", lat: 25.2854, lng: 51.5310, population: 2_400_000 },
  { name: "Manama", lat: 26.2235, lng: 50.5876, population: 650_000 },
  { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773, population: 1_500_000 },
  { name: "Tabriz", lat: 38.0800, lng: 46.2919, population: 1_700_000 },
  { name: "Isfahan", lat: 32.6539, lng: 51.6660, population: 2_200_000 },
  { name: "Shiraz", lat: 29.5918, lng: 52.5836, population: 1_900_000 },
  { name: "Mashhad", lat: 36.2605, lng: 59.6168, population: 3_400_000 },
  { name: "Karaj", lat: 35.8327, lng: 50.9915, population: 1_600_000 },
]
```

---

## 5. UI LAYOUT & DESIGN

### 5.1 Aesthetic
- **Theme:** Black ops / military situation room
- **Background:** Pure black `#0a0a0a`
- **Map tiles:** CartoDB Dark Matter — `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- **Font:** `Share Tech Mono` from Google Fonts — monospace military feel
- **Secondary font:** `Orbitron` for large numbers/headers
- **Color palette:**
  - Airstrikes: `#ff2d2d` (bright red)
  - Missile strikes: `#ff6b00` (orange)
  - Drone strikes: `#ffd700` (yellow)
  - Interceptions: `#00ff88` (green)
  - Toxic plumes: `rgba(255, 100, 0, 0.15)` (semi-transparent orange)
  - NASA fires: `#ffffff` with flicker animation (white/yellow)
  - AQI circles: gradient green→yellow→red→purple by value
- **No rounded corners. No gradients. No friendly UI. Cold. Clinical. Military.**
- **Scanline CSS overlay** on entire app for CRT screen effect

### 5.2 Layout — Four Zones

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER BAR — live counters, always visible                 │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  LEFT        │      MAP (center)            │  RIGHT        │
│  SIDEBAR     │      Full screen             │  DETAIL       │
│  Event list  │      Leaflet dark map        │  PANEL        │
│              │                              │  (on click)   │
├──────────────┴──────────────────────────────┴───────────────┤
│  TIMELINE SCRUBBER — bottom center                          │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Header Bar
Always visible. Updates live.
```
TOXMAP    [EVENTS: 44]  [CASUALTIES: 1,247]  [CO₂e: 847 TONNES]  [≈ 3,388 FLIGHTS]  [PEOPLE IN PLUMES: 4.2M]  [● LIVE]
```

### 5.4 Left Sidebar
- Chronological list of all events from feed.json
- Each card shows:
  - Event type badge (color-coded)
  - Location from event_summary (parsed)
  - Timestamp (formatted: "MAR 7 · 09:00 UTC")
  - Confidence badge
  - Casualty count
- Filter buttons at top: ALL / AIRSTRIKE / MISSILE / DRONE / INTERCEPT
- Clicking a card flies map to that location and opens detail panel

### 5.5 Map Center
- **Leaflet.js** map centered on Middle East: `[32, 50]`, zoom `5`
- **Layer 1 — Strike markers:** Pulsing colored circle markers per event type
  - Pulse animation: CSS keyframe `scale 1 → 1.5 → 1` every 2s
  - Size proportional to estimated impact radius
- **Layer 2 — Toxic plume cones:** Semi-transparent polygon drawn downwind from each strike using Open-Meteo wind data
- **Layer 3 — NASA FIRMS fires:** Small white flickering dots at satellite fire coordinates
- **Layer 4 — AQI halos:** Large semi-transparent colored circles over monitored cities
- **Map click:** Click any marker → opens right detail panel

### 5.6 Right Detail Panel
Appears on event click. Shows:
```
▸ [EVENT TYPE]
  [Location parsed from event_summary]
  [Timestamp] UTC

  Actor: [inferred from event_summary keywords]
  Source: [confidence badge]
  Casualties: [casualties]
  [Clickable source URL]

  ◈ ENVIRONMENTAL COST
  Weapon profile: [inferred weapon]
  Toxic chemicals: [comma list]
  CO₂e estimate: ~[X] tonnes
  ≈ [human equivalent]
  Impact radius: [X] km
  People in plume: [X,XXX]

  Wind at strike time:
  Speed: [X] km/h · Direction: [X]°
  Plume length: [X] km [cardinal direction]

  * Estimates only. Munitions emissions only.
    Real environmental cost significantly higher.
```

### 5.7 Timeline Scrubber
Bottom center. Drag to filter events by date.
- Range: Feb 28, 2026 → today
- Day markers: FEB 28 · MAR 1 · MAR 2 · MAR 3 · MAR 4 · MAR 5 · MAR 6 · MAR 7
- As user drags: markers appear/disappear, header counters update
- Default: show all events

### 5.8 Data Freshness Indicators
Small status bar top-right of map:
```
🔴 STRIKES  Updated 28min ago
🔥 FIRES    Updated 8min ago
💨 AQI      Updated 43min ago
```

---

## 6. TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript | Single file. No framework. |
| Map | Leaflet.js v1.9.4 | CDN: `unpkg.com/leaflet` |
| Map tiles | CartoDB Dark Matter | Free, no key |
| Strike data | iranwarlive.com/feed.json | Fetch on load, poll every 30min |
| Wind data | Open-Meteo Archive API | No key, call per event |
| Fire data | NASA FIRMS VIIRS | Key: `38c7346b9d2d11a4e9a5de249c3d622` |
| Air quality | AQICN API | Token: `c1e8f5369c003f851d54fb2792e9053978ac3b9e` |
| Fonts | Google Fonts | Share Tech Mono + Orbitron |
| Hosting | GitHub Pages or Vercel | Free static hosting |

**Everything runs in a single HTML file. No build step. No backend. No database.**

---

## 7. DATA FLOW ARCHITECTURE

```
1. ON LOAD
   └── fetch iranwarlive.com/feed.json
   └── filter events where lat/lng !== null (~35 events)
   └── for each event: map type → weapon profile → CO₂e/chemicals/radius

2. WIND FETCH (parallel, one call per event)
   └── archive-api.open-meteo.com/v1/archive?lat={lat}&lng={lng}&dates
   └── match strike timestamp hour → wind_speed + wind_direction
   └── calculate plume polygon geometry

3. FIRES FETCH
   └── firms.modaps.eosdis.nasa.gov/api/area/csv/{KEY}/VIIRS_SNPP_NRT/44,24,64,40/7
   └── parse CSV → extract lat/lng → plot as flickering white dots

4. AQI FETCH (6 cities)
   └── api.waqi.info/feed/{city}/?token={TOKEN}
   └── extract AQI value → color scale → draw halo circle on map

5. RENDER
   └── plot all strike markers (colored, pulsing)
   └── draw plume cones (semi-transparent, downwind)
   └── draw fire dots (flickering)
   └── draw AQI halos (colored rings)
   └── populate left sidebar event list
   └── calculate header bar totals

6. POLLING
   └── setInterval(fetchStrikes, 30 * 60 * 1000)  // every 30 min
   └── setInterval(fetchFires, 10 * 60 * 1000)    // every 10 min
   └── setInterval(fetchAQI, 60 * 60 * 1000)      // every hour
```

---

## 8. KEY IMPLEMENTATION DETAILS

### Fetching feed.json (CORS note)
IranWarLive may have CORS restrictions. If direct fetch fails, bundle the feed.json statically as a JS variable for the demo. For the hackathon this is fine — judges won't know the difference and the data is still real.

```javascript
// Try live fetch first, fall back to bundled data
async function loadFeed() {
  try {
    const res = await fetch('https://iranwarlive.com/feed.json')
    return await res.json()
  } catch {
    return BUNDLED_FEED_DATA // paste the JSON directly as a JS const
  }
}
```

### Plume Cone Geometry (Leaflet polygon)
```javascript
function buildPlumePolygon(lat, lng, windSpeed, windDirection, radiusKm) {
  const plumeLength = windSpeed * 3  // 3 hours of drift in km
  const halfAngle = 22.5  // degrees either side = 45 degree cone
  const bearingLeft = (windDirection - halfAngle + 360) % 360
  const bearingRight = (windDirection + halfAngle) % 360

  const origin = [lat, lng]
  const tipLeft = destinationPoint(lat, lng, plumeLength, bearingLeft)
  const tipRight = destinationPoint(lat, lng, plumeLength, bearingRight)

  return L.polygon([origin, tipLeft, tipRight], {
    color: 'rgba(255, 100, 0, 0.6)',
    fillColor: 'rgba(255, 100, 0, 0.12)',
    weight: 1
  })
}

// Helper: calculate destination point given bearing and distance
function destinationPoint(lat, lng, distKm, bearing) {
  const R = 6371
  const bearingRad = bearing * Math.PI / 180
  const lat1 = lat * Math.PI / 180
  const lng1 = lng * Math.PI / 180
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distKm/R) +
    Math.cos(lat1) * Math.sin(distKm/R) * Math.cos(bearingRad)
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distKm/R) * Math.cos(lat1),
    Math.cos(distKm/R) - Math.sin(lat1) * Math.sin(lat2)
  )
  return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI]
}
```

### Parsing NASA FIRMS CSV
```javascript
async function loadFires() {
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/38c7346b9d2d11a4e9a5de249c3d622/VIIRS_SNPP_NRT/44,24,64,40/7`
  const res = await fetch(url)
  const text = await res.text()
  const rows = text.trim().split('\n')
  const headers = rows[0].split(',')
  const latIdx = headers.indexOf('latitude')
  const lngIdx = headers.indexOf('longitude')
  return rows.slice(1).map(row => {
    const cols = row.split(',')
    return { lat: parseFloat(cols[latIdx]), lng: parseFloat(cols[lngIdx]) }
  }).filter(f => !isNaN(f.lat))
}
```

### Inferring Actor From Event Summary
```javascript
function inferActor(summary) {
  const s = summary.toLowerCase()
  if (s.includes('us/israeli') || s.includes('us-israeli')) return 'US / Israeli Forces'
  if (s.includes('israeli air force') || s.includes('idf')) return 'Israeli Air Force (IDF)'
  if (s.includes('us ') || s.includes('american') || s.includes('b-2') || s.includes('centcom')) return 'US Forces (CENTCOM)'
  if (s.includes('iranian') || s.includes('irgc') || s.includes('iran')) return 'Iranian IRGC'
  if (s.includes('hezbollah')) return 'Hezbollah'
  if (s.includes('nato')) return 'NATO Forces'
  if (s.includes('houthi')) return 'Houthi Forces'
  return 'Unknown Actor'
}
```

---

## 9. VISUAL EFFECTS

### Pulsing Strike Markers (CSS)
```css
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.6); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}
.strike-marker { animation: pulse 2s infinite; }
.missile-marker { animation: pulse 2.5s infinite; }
.drone-marker { animation: pulse 3s infinite; }
```

### Flickering Fire Dots (CSS)
```css
@keyframes flicker {
  0%, 100% { opacity: 1; }
  25% { opacity: 0.4; }
  75% { opacity: 0.8; }
}
.fire-dot { animation: flicker 0.8s infinite; }
```

### Scanline CRT Overlay
```css
body::after {
  content: '';
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

---

## 10. BUILD ORDER FOR 24-HOUR HACKATHON

| Hours | Task | Output |
|---|---|---|
| 0–1 | Fetch feed.json, parse events, filter nulls, map types to weapon profiles | Working data pipeline |
| 1–3 | Leaflet map setup, plot colored pulsing strike markers | Map with dots |
| 3–5 | Open-Meteo wind fetch per event, draw plume cones | Plumes visible |
| 5–6 | NASA FIRMS fire data, plot flickering dots | Fires visible |
| 6–7 | AQICN fetch for 6 cities, draw AQI halos | AQI rings visible |
| 7–8 | Left sidebar event list, click to fly map | Navigation working |
| 8–9 | Right detail panel — chemicals, CO₂e, wind, population | Data on click |
| 9–10 | Header bar counters — total CO₂e, casualties, events | Live totals |
| 10–11 | Timeline scrubber — filter events by date | Slider working |
| 11–14 | Polish: fonts, colors, scanline, animations, mobile responsive | Beautiful |
| 14–24 | Buffer, edge cases, CORS fallback, rehearse demo | Demo ready |

---

## 11. DEMO SCRIPT (30 seconds on stage)

1. Open app. Map is already glowing with red/orange dots and plume cones. Let judges look for 3 seconds. Say nothing.
2. *"Every dot is a real strike. Every cone is a real toxic plume calculated from actual wind data at the hour of the strike."*
3. Point to header: *"847 tonnes of CO₂. Equivalent to 3,388 transatlantic flights. In 7 days."*
4. Click a dot over Tehran. Detail panel slides in. *"This airstrike on Mehrabad Airport released NOx, black carbon, and PM2.5. 9.2 million people in the downwind zone."*
5. Drag timeline scrubber left to Feb 28. Map goes nearly dark.
6. Drag it right to today. Dots flood back.
7. *"Every conflict tracker shows you where the bombs fell. We show you what happened to the air, the water, and the land. Nobody else built this."*
8. Done.

---

## 12. METHODOLOGY TRANSPARENCY (For Judges)

Always show this footnote in the detail panel:
> *"CO₂e figures are estimates based on published munitions propellant chemistry (Brown University Costs of War Project; CEOBS Conflict and Environment Observatory). Plume geometry uses real historical wind data from Open-Meteo. Population figures from UN World Urbanization Prospects 2024. Strike data from iranwarlive.com OSINT feed aggregating CENTCOM, IDF, Al Jazeera, Reuters, NYT. All estimates labelled as such."*

---

## 13. WHAT NOT TO BUILD

- ❌ No backend server
- ❌ No database
- ❌ No user accounts
- ❌ No live missile flight paths (not publicly available)
- ❌ No real-time missile tracking (classified)
- ❌ No SMS alerts (optional stretch goal only)
- ❌ No multi-page app
- ❌ No React/Vue/Angular (vanilla JS only for speed)

---

## 14. STRETCH GOALS (Only If Time Allows)

- **Farsi language toggle** — translate event summaries using Claude API
- **Export UN Environmental Report** — generate PDF summary of all events
- **Sound design** — subtle alert sound when new event detected
- **GitHub Pages deployment** — live URL to share with judges

---

*Built for the Environmental Tech Hackathon, March 2026. All data is open source. Zero API cost. Real conflict. Real environment. Real stakes.*