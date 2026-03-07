# environmental-layers/plume-engine/

Fetches historical wind data from Open-Meteo for each strike event at the exact UTC hour it occurred, calculates a plume cone polygon using spherical geometry, and renders it as a MapLibre GeoJSON fill layer.

This is the most technically complex module. It involves parallel API calls, timestamp matching, and spherical geometry.

## What to build

### File: `PlumeEngine.svelte`

Headless Svelte component. Receives `map` and `events` as props. Adds a GeoJSON fill layer to the map. Reactively updates when `events` changes.

---

## Implementation

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'

  let { map, events = [] } = $props()

  const SOURCE_ID = 'plumes'
  const LAYER_ID  = 'plumes-fill'

  onMount(() => {
    // Wait for MapLibre style to finish loading
    if (map.isStyleLoaded()) {
      initLayer()
    } else {
      map.on('load', initLayer)
    }
  })

  function initLayer() {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })

    map.addLayer({
      id: LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': 'rgba(255, 100, 0, 0.12)',
        'fill-outline-color': 'rgba(255, 100, 0, 0.6)',
      }
    })
  }

  // Re-fetch wind and update plumes when events change
  $effect(() => {
    const currentEvents = events  // capture for this run
    if (!map || !currentEvents.length) return
    if (!map.getSource(SOURCE_ID)) return

    drawPlumes(currentEvents)
  })

  async function drawPlumes(eventList) {
    // Fetch wind for all events in parallel
    const windResults = await Promise.all(
      eventList.map(e => fetchWindForEvent(e))
    )

    const features = []

    eventList.forEach((event, i) => {
      const { windSpeed, windDirection } = windResults[i]

      // Attach wind data to event object for detail panel
      event.wind = { windSpeed, windDirection }
      event.plumeLength = Math.round(windSpeed * 3)
      event.citiesInPlume = getCitiesInPlume(event)

      const feature = buildPlumeFeature(event.lat, event.lng, windSpeed, windDirection)
      if (feature) features.push(feature)
    })

    map.getSource(SOURCE_ID)?.setData({
      type: 'FeatureCollection',
      features,
    })
  }

  onDestroy(() => {
    if (map?.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
    if (map?.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
  })
</script>
```

---

## Wind fetch

```javascript
async function fetchWindForEvent(event) {
  const date = event.timestamp.split('T')[0]  // "2026-03-07"
  const url = `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${event.lat}&longitude=${event.lng}` +
    `&start_date=${date}&end_date=${date}` +
    `&hourly=wind_speed_10m,wind_direction_10m`

  try {
    const res = await fetch(url)
    const data = await res.json()
    const hour = new Date(event.timestamp).getUTCHours()
    return {
      windSpeed: data.hourly.wind_speed_10m[hour] ?? 15,     // km/h
      windDirection: data.hourly.wind_direction_10m[hour] ?? 270,  // degrees
    }
  } catch {
    return { windSpeed: 15, windDirection: 270 }  // fallback: 15 km/h westward
  }
}
```

---

## Plume geometry — builds a GeoJSON Feature

```javascript
function buildPlumeFeature(lat, lng, windSpeed, windDirection) {
  const plumeLength = windSpeed * 3  // km — 3 hours of drift
  if (plumeLength < 1) return null   // skip if wind is essentially calm

  const halfAngle = 22.5  // 45° cone total

  const tipLeft  = destinationPoint(lat, lng, plumeLength, (windDirection - halfAngle + 360) % 360)
  const tipRight = destinationPoint(lat, lng, plumeLength, (windDirection + halfAngle) % 360)

  // MapLibre GeoJSON: coordinates are [longitude, latitude]
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [lng, lat],                    // origin (strike point)
        [tipLeft[1], tipLeft[0]],      // left tip  — convert [lat,lng] → [lng,lat]
        [tipRight[1], tipRight[0]],    // right tip
        [lng, lat],                    // close polygon
      ]]
    },
    properties: { windSpeed, windDirection }
  }
}

function destinationPoint(lat, lng, distKm, bearing) {
  const R = 6371
  const b = bearing * Math.PI / 180
  const lat1 = lat * Math.PI / 180
  const lng1 = lng * Math.PI / 180
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distKm / R) +
    Math.cos(lat1) * Math.sin(distKm / R) * Math.cos(b)
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(b) * Math.sin(distKm / R) * Math.cos(lat1),
    Math.cos(distKm / R) - Math.sin(lat1) * Math.sin(lat2)
  )
  return [lat2 * 180 / Math.PI, lng2 * 180 / Math.PI]  // returns [lat, lng]
}
```

**Note on coordinate order:** `destinationPoint` returns `[lat, lng]` for internal math. When building the GeoJSON Feature, flip them to `[lng, lat]` for MapLibre.

---

## People in plume calculation

After computing the plume for each event, check which CITIES fall inside the cone and attach to the event:

```javascript
import { CITIES } from '../../data-pipeline/weapon-profiles/weaponProfiles.js'

function getCitiesInPlume(event) {
  if (!event.wind || !event.plumeLength) return []

  return CITIES.filter(city => {
    const dist = haversineKm(event.lat, event.lng, city.lat, city.lng)
    if (dist > event.plumeLength) return false
    const bearing = bearingTo(event.lat, event.lng, city.lat, city.lng)
    const diff = Math.abs(((bearing - event.wind.windDirection) + 180 + 360) % 360 - 180)
    return diff <= 22.5
  })
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function bearingTo(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI/180)
  const x = Math.cos(lat1 * Math.PI/180) * Math.sin(lat2 * Math.PI/180) -
    Math.sin(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.cos(dLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}
```

---

## Plume geometry explained

- **Plume length** = wind speed (km/h) × 3 hours
- **Wind direction** = where the wind blows TO (270° = blowing westward)
- **Cone** = triangle with apex at strike point, 45° wide, extending downwind

Example: Wind 20 km/h at 270° → 60 km cone pointing west.

---

## What NOT to do

- Do not use `Promise.all` then block rendering — update the source once all data is ready
- Do not crash if Open-Meteo fails — use the fallback `{ windSpeed: 15, windDirection: 270 }`
- Do not add the plume layer as interactive — the GeoJSON fill layer should not capture clicks
- Do not flip to `interactive: false` in MapLibre — instead, use `map.on('click', LAYER_ID)` only if you need it, otherwise omit the event listener entirely

---

## Test it

After mounting with events:
- Orange semi-transparent triangles extend from each strike point
- Each triangle points in a consistent downwind direction (varies by location/time)
- Clicking through a triangle still selects the strike marker underneath it
- `events[0].wind` is populated with `{ windSpeed, windDirection }`
- `events[0].citiesInPlume` is an array of city objects
