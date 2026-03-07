# environmental-layers/nasa-fires/

Fetches satellite fire detection data from NASA FIRMS VIIRS, parses the CSV, and renders hundreds of fire points as a MapLibre GeoJSON circle layer with CSS flicker animation.

We use a **GeoJSON circle layer** (not individual HTML markers) because there are potentially thousands of fire detections. A single GeoJSON layer with all points renders them in one WebGL draw call — orders of magnitude faster than creating hundreds of DOM elements.

## What to build

### File: `NasaFires.svelte`

Headless Svelte component. Receives `map` as prop. Adds its own GeoJSON source + circle layer. Polls every 10 minutes.

---

## Implementation

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'

  let { map } = $props()

  const SOURCE_ID  = 'fires'
  const LAYER_ID   = 'fires-circle'
  const FIRMS_URL  = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/38c7346b9d2d11a4e9a5de249c3d622/VIIRS_SNPP_NRT/44,24,64,40/7`

  let pollInterval

  onMount(() => {
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
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 2.5,
        'circle-color': '#ffffff',
        'circle-opacity': 0.9,
        'circle-stroke-width': 0,
      }
    })

    // Initial fetch + start polling
    fetchAndUpdate()
    pollInterval = setInterval(fetchAndUpdate, 10 * 60 * 1000)
  }

  async function fetchAndUpdate() {
    const fires = await fetchFireData()
    const features = fires.map(f => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [f.lng, f.lat] },  // [lng, lat]!
      properties: {}
    }))
    map.getSource(SOURCE_ID)?.setData({ type: 'FeatureCollection', features })
  }

  async function fetchFireData() {
    try {
      const res = await fetch(FIRMS_URL)
      const text = await res.text()
      const rows = text.trim().split('\n')
      const headers = rows[0].split(',')
      const latIdx = headers.indexOf('latitude')
      const lngIdx = headers.indexOf('longitude')

      return rows.slice(1)
        .map(row => {
          const cols = row.split(',')
          return { lat: parseFloat(cols[latIdx]), lng: parseFloat(cols[lngIdx]) }
        })
        .filter(f => !isNaN(f.lat) && !isNaN(f.lng))
    } catch (err) {
      console.warn('NASA FIRMS fetch failed:', err)
      return []
    }
  }

  onDestroy(() => {
    clearInterval(pollInterval)
    if (map?.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
    if (map?.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
  })
</script>
```

---

## Flicker animation

MapLibre WebGL layers don't support CSS animations directly. To get the flicker effect on the fire dots, animate the layer's `circle-opacity` using MapLibre's `map.setPaintProperty` on a `requestAnimationFrame` loop:

```javascript
// Add this inside initLayer(), after addLayer()
let flickerFrame
let t = 0

function animateFlicker() {
  t += 0.05
  const opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * 2.5 + Math.random() * 0.1))
  map.setPaintProperty(LAYER_ID, 'circle-opacity', opacity)
  flickerFrame = requestAnimationFrame(animateFlicker)
}
animateFlicker()

// In onDestroy(), add:
cancelAnimationFrame(flickerFrame)
```

Alternatively, if the performance impact of `setPaintProperty` per frame is noticeable, create two MapLibre layers with different opacities and alternate between them using `setLayoutProperty('visibility', 'visible'/'none')` every 400ms.

---

## API Details

- **URL:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/38c7346b9d2d11a4e9a5de249c3d622/VIIRS_SNPP_NRT/44,24,64,40/7`
- **Key:** `38c7346b9d2d11a4e9a5de249c3d622` (embedded in URL)
- **Bbox:** `44,24,64,40` = west,south,east,north = Middle East
- **`/7`** = last 7 days
- **Returns:** CSV with columns including `latitude`, `longitude`

---

## What NOT to do

- Do not create individual HTML markers for fire dots — too slow for hundreds/thousands of points
- Do not crash if NASA API is down — `fetchFireData()` catches errors and returns `[]`
- Do not add click handlers to the fire layer — fires are background visual, not interactive
- Do not filter by fire confidence — plot all detections

---

## Test it

After mounting:
- Hundreds of small white dots appear clustered near conflict zones in the Middle East
- Dots flicker (opacity animates continuously)
- Clicking a dot does not open any panel
- After 10 minutes, the dots refresh (may shift slightly as new detections come in)

Expected count: 500–2000+ fire detections over 7 days across the Middle East bounding box.
