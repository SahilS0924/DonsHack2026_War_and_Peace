# environmental-layers/aqi-halos/

Fetches real-time AQI data for 6 major cities from AQICN and renders large semi-transparent colored circles (halos) as a MapLibre GeoJSON fill layer. Color encodes air quality severity.

## What to build

### File: `AqiHalos.svelte`

Headless Svelte component. Receives `map` as prop. Adds GeoJSON sources + layers for halos and city dots. Polls every hour.

---

## Implementation

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'

  let { map } = $props()

  const HALO_SOURCE = 'aqi-halos'
  const HALO_LAYER  = 'aqi-halos-fill'
  const DOT_SOURCE  = 'aqi-dots'
  const DOT_LAYER   = 'aqi-dots-circle'

  const TOKEN = 'c1e8f5369c003f851d54fb2792e9053978ac3b9e'

  const AQI_CITIES = [
    { name: 'Tehran',      slug: 'tehran' },
    { name: 'Baghdad',     slug: 'baghdad' },
    { name: 'Kuwait City', slug: 'kuwait' },
    { name: 'Beirut',      slug: 'beirut' },
    { name: 'Dubai',       slug: 'dubai' },
    { name: 'Tel Aviv',    slug: 'tel-aviv' },
  ]

  let pollInterval

  onMount(() => {
    if (map.isStyleLoaded()) {
      initLayers()
    } else {
      map.on('load', initLayers)
    }
  })

  function initLayers() {
    // Halo fill layer (large transparent circles via buffered GeoJSON)
    map.addSource(HALO_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addLayer({
      id: HALO_LAYER,
      type: 'fill',
      source: HALO_SOURCE,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': 0.07,
      }
    })

    // City center dots
    map.addSource(DOT_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addLayer({
      id: DOT_LAYER,
      type: 'circle',
      source: DOT_SOURCE,
      paint: {
        'circle-radius': 8,
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.9,
        'circle-stroke-width': 2,
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-opacity': 0.5,
      }
    })

    // Tooltip on hover for city dots
    map.on('mouseenter', DOT_LAYER, (e) => {
      map.getCanvas().style.cursor = 'pointer'
      const props = e.features[0].properties
      // Show a simple popup
      new maplibregl.Popup({ closeButton: false, className: 'aqi-popup' })
        .setLngLat(e.lngLat)
        .setHTML(`<strong>${props.name}</strong><br>AQI: ${props.aqi}`)
        .addTo(map)
    })
    map.on('mouseleave', DOT_LAYER, () => {
      map.getCanvas().style.cursor = ''
      document.querySelectorAll('.maplibregl-popup').forEach(p => p.remove())
    })

    fetchAndUpdate()
    pollInterval = setInterval(fetchAndUpdate, 60 * 60 * 1000)
  }

  function aqiColor(aqi) {
    if (aqi <= 50)  return '#00e400'   // green   — Good
    if (aqi <= 100) return '#ffff00'   // yellow  — Moderate
    if (aqi <= 150) return '#ff7e00'   // orange  — USG
    if (aqi <= 200) return '#ff0000'   // red     — Unhealthy
    if (aqi <= 300) return '#8f3f97'   // purple  — Very Unhealthy
    return '#7e0023'                   // maroon  — Hazardous
  }

  // Generate an approximate circle polygon (GeoJSON doesn't have a circle type)
  function circlePolygon(lng, lat, radiusKm, steps = 64) {
    const coords = []
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI
      const dx = (radiusKm / 111.32) / Math.cos(lat * Math.PI / 180)
      const dy = radiusKm / 110.574
      coords.push([lng + dx * Math.cos(angle), lat + dy * Math.sin(angle)])
    }
    return coords
  }

  async function fetchAndUpdate() {
    const results = await Promise.allSettled(
      AQI_CITIES.map(city =>
        fetch(`https://api.waqi.info/feed/${city.slug}/?token=${TOKEN}`)
          .then(r => r.json())
          .then(json => {
            if (json.status !== 'ok') return null
            return {
              name: city.name,
              aqi: json.data.aqi,
              lat: json.data.city.geo[0],   // AQICN returns [lat, lng]
              lng: json.data.city.geo[1],
            }
          })
      )
    )

    const haloFeatures = []
    const dotFeatures  = []

    results.forEach(r => {
      if (r.status !== 'fulfilled' || !r.value) return
      const { name, aqi, lat, lng } = r.value
      const color = aqiColor(aqi)

      // Halo: approximate 50km circle polygon
      haloFeatures.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circlePolygon(lng, lat, 50)] },
        properties: { color, name, aqi }
      })

      // Dot: point at city center
      dotFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: { color, name, aqi }
      })
    })

    map.getSource(HALO_SOURCE)?.setData({ type: 'FeatureCollection', features: haloFeatures })
    map.getSource(DOT_SOURCE)?.setData({ type: 'FeatureCollection', features: dotFeatures })
  }

  onDestroy(() => {
    clearInterval(pollInterval)
    ;[HALO_LAYER, DOT_LAYER].forEach(id => { if (map?.getLayer(id)) map.removeLayer(id) })
    ;[HALO_SOURCE, DOT_SOURCE].forEach(id => { if (map?.getSource(id)) map.removeSource(id) })
  })
</script>
```

---

## AQI popup CSS (in `assets/styles/app.css`)

```css
.aqi-popup .maplibregl-popup-content {
  background: #0a0a0a;
  border: 1px solid #333;
  color: #ccc;
  font-family: 'Share Tech Mono', monospace;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 0;
  box-shadow: none;
}

.aqi-popup .maplibregl-popup-tip { border-top-color: #333; }
```

---

## AQI Color Scale

| AQI Range | Color | Meaning |
|---|---|---|
| 0–50 | `#00e400` green | Good |
| 51–100 | `#ffff00` yellow | Moderate |
| 101–150 | `#ff7e00` orange | Unhealthy for Sensitive Groups |
| 151–200 | `#ff0000` red | Unhealthy |
| 201–300 | `#8f3f97` purple | Very Unhealthy |
| 300+ | `#7e0023` maroon | Hazardous |

---

## What NOT to do

- Do not crash if one city's fetch fails — `Promise.allSettled` handles it, skip nulls
- Do not use fixed city coordinates — use `json.data.city.geo` from the API response
- Do not make halos interactive (block clicks) — they are background visual only
- Do not use Leaflet's `L.circle` — this is MapLibre, use the polygon approximation approach

---

## Test it

After mounting:
- 6 large colored transparent rings visible over Tehran, Baghdad, Kuwait City, Beirut, Dubai, Tel Aviv
- Ring color reflects actual live AQI (likely orange/red near conflict zones)
- Small colored dot at each city center
- Hovering over a dot shows city name + AQI number in a dark popup
- After 1 hour, data refreshes
