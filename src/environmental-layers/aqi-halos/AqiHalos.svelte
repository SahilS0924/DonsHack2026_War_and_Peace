<script>
  import { onMount, onDestroy } from 'svelte'
  import maplibregl from 'maplibre-gl'

  let { map, onAqiLoad = () => {} } = $props()

  const TOKEN = import.meta.env.VITE_AQICN_TOKEN
  const CITY_SLUGS = ['tehran', 'baghdad', 'kuwait', 'dubai', 'tel-aviv', 'riyadh', 'beirut']
  const SOURCE_ID = 'aqi-halos'
  const HALO_LAYER = 'aqi-halos-fill'
  const DOTS_SOURCE = 'aqi-dots'
  const DOTS_LAYER = 'aqi-dots-circle'

  let pollTimer = null
  let popup = null

  function aqiColor(aqi) {
    if (aqi <= 50)  return 'rgba(0,228,0,0.15)'
    if (aqi <= 100) return 'rgba(255,255,0,0.15)'
    if (aqi <= 150) return 'rgba(255,126,0,0.15)'
    if (aqi <= 200) return 'rgba(255,0,0,0.15)'
    if (aqi <= 300) return 'rgba(143,63,151,0.15)'
    return 'rgba(126,0,35,0.15)'
  }

  function aqiDotColor(aqi) {
    if (aqi <= 50)  return '#00e400'
    if (aqi <= 100) return '#ffff00'
    if (aqi <= 150) return '#ff7e00'
    if (aqi <= 200) return '#ff0000'
    if (aqi <= 300) return '#8f3f97'
    return '#7e0023'
  }

  function circlePolygon(lat, lng, radiusKm) {
    const points = []
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * 2 * Math.PI
      const dLat = (radiusKm / 111) * Math.cos(angle)
      const dLng = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
      points.push([lng + dLng, lat + dLat])
    }
    return points
  }

  async function fetchAQI() {
    const results = await Promise.allSettled(
      CITY_SLUGS.map(city =>
        fetch(`https://api.waqi.info/feed/${city}/?token=${TOKEN}`).then(r => r.json())
      )
    )
    return results
      .filter(r => r.status === 'fulfilled' && r.value?.status === 'ok')
      .map(r => r.value.data)
      .filter(d => d?.city?.geo && d.aqi && d.aqi !== '-')
      .map(d => ({
        name: d.city.name,
        lat: d.city.geo[0],
        lng: d.city.geo[1],
        aqi: parseInt(d.aqi),
      }))
      .filter(d => !isNaN(d.aqi))
  }

  function buildGeoJSON(cities) {
    const halos = cities.map(c => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [circlePolygon(c.lat, c.lng, Math.max(30, c.aqi / 5))],
      },
      properties: { color: aqiColor(c.aqi), name: c.name, aqi: c.aqi },
    }))

    const dots = cities.map(c => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lng, c.lat] },
      properties: { color: aqiDotColor(c.aqi), name: c.name, aqi: c.aqi },
    }))

    return { halos, dots }
  }

  async function loadAndUpdate() {
    try {
      const cities = await fetchAQI()
      const { halos, dots } = buildGeoJSON(cities)

      if (map.getSource(SOURCE_ID)) {
        map.getSource(SOURCE_ID).setData({ type: 'FeatureCollection', features: halos })
      }
      if (map.getSource(DOTS_SOURCE)) {
        map.getSource(DOTS_SOURCE).setData({ type: 'FeatureCollection', features: dots })
      }
      onAqiLoad()
    } catch {}
  }

  function initLayers() {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: HALO_LAYER,
        type: 'fill',
        source: SOURCE_ID,
        paint: { 'fill-color': ['get', 'color'] },
      })
    }

    if (!map.getSource(DOTS_SOURCE)) {
      map.addSource(DOTS_SOURCE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: DOTS_LAYER,
        type: 'circle',
        source: DOTS_SOURCE,
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 6,
          'circle-opacity': 0.9,
        },
      })
    }

    // Hover popup on dots
    map.on('mouseenter', DOTS_LAYER, e => {
      map.getCanvas().style.cursor = 'pointer'
      const props = e.features[0].properties
      popup = new maplibregl.Popup({ className: 'aqi-popup', closeButton: false })
        .setLngLat(e.lngLat)
        .setHTML(`<div>${props.name}<br>AQI: <strong>${props.aqi}</strong></div>`)
        .addTo(map)
    })
    map.on('mouseleave', DOTS_LAYER, () => {
      map.getCanvas().style.cursor = ''
      popup?.remove()
      popup = null
    })
  }

  onMount(() => {
    function init() {
      if (!map.isStyleLoaded()) {
        map.once('load', init)
        return
      }
      initLayers()
      loadAndUpdate()
      pollTimer = setInterval(loadAndUpdate, 60 * 60 * 1000)
    }
    init()
  })

  onDestroy(() => {
    if (pollTimer) clearInterval(pollTimer)
    popup?.remove()
    try {
      if (map.getLayer(DOTS_LAYER)) map.removeLayer(DOTS_LAYER)
      if (map.getLayer(HALO_LAYER)) map.removeLayer(HALO_LAYER)
      if (map.getSource(DOTS_SOURCE)) map.removeSource(DOTS_SOURCE)
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    } catch {}
  })
</script>
