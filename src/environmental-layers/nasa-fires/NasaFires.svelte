<script>
  import { onMount, onDestroy } from 'svelte'

  let { map, onFiresLoad = () => {} } = $props()

  const FIRMS_URL = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${import.meta.env.VITE_FIRMS_KEY}/VIIRS_SNPP_NRT/44,24,64,40/1`
  const SOURCE_ID = 'nasa-fires'
  const LAYER_ID = 'fires-circle'

  let rafId = null
  let pollTimer = null
  let initiated = false

  async function fetchFires() {
    const res = await fetch(FIRMS_URL)
    const csv = await res.text()
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []
    const headers = lines[0].split(',')
    const latIdx = headers.indexOf('latitude')
    const lngIdx = headers.indexOf('longitude')
    return lines.slice(1).map(line => {
      const cols = line.split(',')
      return { lat: parseFloat(cols[latIdx]), lng: parseFloat(cols[lngIdx]) }
    }).filter(f => !isNaN(f.lat) && !isNaN(f.lng))
  }

  function toGeoJSON(fires) {
    return {
      type: 'FeatureCollection',
      features: fires.map(f => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
        properties: {},
      })),
    }
  }

  function flicker() {
    if (!map.getLayer(LAYER_ID)) return
    const opacity = 0.5 + 0.4 * Math.sin(Date.now() / 400) + Math.random() * 0.1
    map.setPaintProperty(LAYER_ID, 'circle-opacity', Math.max(0.1, Math.min(1, opacity)))
    rafId = requestAnimationFrame(flicker)
  }

  async function loadAndUpdate() {
    try {
      const fires = await fetchFires()
      if (map.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData(toGeoJSON(fires))
      }
      onFiresLoad()
    } catch {}
  }

  function initLayers() {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-color': '#ffffff',
          'circle-radius': 2.5,
          'circle-opacity': 0.8,
          'circle-blur': 0.5,
        },
      })
    }
    initiated = true
  }

  onMount(() => {
    function init() {
      if (!map.isStyleLoaded()) {
        map.once('load', init)
        return
      }
      initLayers()
      loadAndUpdate()
      flicker()
      pollTimer = setInterval(loadAndUpdate, 10 * 60 * 1000)
    }
    init()
  })

  onDestroy(() => {
    if (rafId) cancelAnimationFrame(rafId)
    if (pollTimer) clearInterval(pollTimer)
    try {
      if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    } catch {}
  })
</script>
