<script>
  import { onMount, onDestroy } from 'svelte'

  let { map } = $props()

  const SOURCE_ID = 'aqi-halos'
  const LAYER_ID = 'aqi-halos-fill'
  const OUTLINE_LAYER_ID = 'aqi-halos-outline'
  const TOKEN = 'c1e8f5369c003f851d54fb2792e9053978ac3b9e'

  const CITIES = [
    { slug: 'tehran', geo: [35.6892, 51.389] },
    { slug: 'baghdad', geo: [33.3152, 44.3661] },
    { slug: 'kuwait', geo: [29.3759, 47.9774] },
    { slug: 'beirut', geo: [33.8938, 35.5018] },
    { slug: 'dubai', geo: [25.2048, 55.2708] },
    { slug: 'tel-aviv', geo: [32.0853, 34.7818] },
  ]

  let pollTimer = null

  function aqiToColor(aqi) {
    if (aqi <= 50) return '#00e400'
    if (aqi <= 100) return '#ffff00'
    if (aqi <= 150) return '#ff7e00'
    if (aqi <= 200) return '#ff0000'
    return '#8f3f97'
  }

  async function fetchAqi() {
    const features = []
    for (const city of CITIES) {
      try {
        const res = await fetch(
          `https://api.waqi.info/feed/${city.slug}/?token=${TOKEN}`
        )
        const data = await res.json()
        const aqi = data?.data?.aqi ?? 50
        const [lat, lng] = city.geo
        const color = aqiToColor(aqi)
        const radius = 0.15
        const points = []
        for (let i = 0; i <= 32; i++) {
          const a = (i / 32) * 2 * Math.PI
          points.push([lng + radius * Math.cos(a), lat + radius * Math.sin(a)])
        }
        points.push(points[0])
        features.push({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [points] },
          properties: { color, aqi },
        })
      } catch {}
    }
    return features
  }

  function initLayer() {
    if (!map?.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.12,
        },
      })
      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': ['get', 'color'],
          'line-opacity': 0.5,
          'line-width': 1,
        },
      })
    }
  }

  async function loadAndUpdate() {
    try {
      const features = await fetchAqi()
      if (map?.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData({ type: 'FeatureCollection', features })
      }
    } catch {}
  }

  onMount(() => {
    function init() {
      if (!map?.isStyleLoaded()) {
        map?.once('load', init)
        return
      }
      initLayer()
      loadAndUpdate()
      pollTimer = setInterval(loadAndUpdate, 60 * 60 * 1000)
    }
    init()
  })

  onDestroy(() => {
    if (pollTimer) clearInterval(pollTimer)
    try {
      if (map?.getLayer(OUTLINE_LAYER_ID)) map.removeLayer(OUTLINE_LAYER_ID)
      if (map?.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map?.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    } catch {}
  })
</script>
