<script>
  import { onMount, onDestroy } from 'svelte'

  let { map, events = [], onPlumeData = () => {} } = $props()

  const CITIES = [
    { name: "Tehran",      lat: 35.6892, lng: 51.3890, population: 9_200_000 },
    { name: "Baghdad",     lat: 33.3152, lng: 44.3661, population: 7_200_000 },
    { name: "Tel Aviv",    lat: 32.0853, lng: 34.7818, population: 4_300_000 },
    { name: "Beirut",      lat: 33.8938, lng: 35.5018, population: 2_200_000 },
    { name: "Dubai",       lat: 25.2048, lng: 55.2708, population: 3_400_000 },
    { name: "Kuwait City", lat: 29.3759, lng: 47.9774, population: 3_100_000 },
    { name: "Riyadh",      lat: 24.7136, lng: 46.6753, population: 7_600_000 },
    { name: "Doha",        lat: 25.2854, lng: 51.5310, population: 2_400_000 },
    { name: "Manama",      lat: 26.2235, lng: 50.5876, population:   650_000 },
    { name: "Abu Dhabi",   lat: 24.4539, lng: 54.3773, population: 1_500_000 },
    { name: "Tabriz",      lat: 38.0800, lng: 46.2919, population: 1_700_000 },
    { name: "Isfahan",     lat: 32.6539, lng: 51.6660, population: 2_200_000 },
    { name: "Shiraz",      lat: 29.5918, lng: 52.5836, population: 1_900_000 },
    { name: "Mashhad",     lat: 36.2605, lng: 59.6168, population: 3_400_000 },
    { name: "Karaj",       lat: 35.8327, lng: 50.9915, population: 1_600_000 },
  ]

  const SOURCE_ID = 'plumes'
  const LAYER_ID = 'plumes-fill'
  const LAYER_OUTLINE_ID = 'plumes-outline'

  let initiated = false
  let processing = false
  let plumeCache = new Map() // event_id → plume GeoJSON feature
  let windCache = new Map()  // event_id → { wind, plumeLength, citiesInPlume }

  function destinationPoint(lat, lng, distKm, bearingDeg) {
    const R = 6371
    const d = distKm / R
    const b = (bearingDeg * Math.PI) / 180
    const lat1 = (lat * Math.PI) / 180
    const lng1 = (lng * Math.PI) / 180
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(b))
    const lng2 = lng1 + Math.atan2(Math.sin(b) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2))
    return [(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]
  }

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  function bearing(lat1, lng1, lat2, lng2) {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const la1 = (lat1 * Math.PI) / 180
    const la2 = (lat2 * Math.PI) / 180
    const y = Math.sin(dLng) * Math.cos(la2)
    const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng)
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  async function fetchWind(event) {
    const date = event.timestamp.slice(0, 10)
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${event.lat}&longitude=${event.lng}&start_date=${date}&end_date=${date}&hourly=wind_speed_10m,wind_direction_10m&timezone=UTC`
    const res = await fetch(url)
    const json = await res.json()
    const hour = new Date(event.timestamp).getUTCHours()
    return {
      windSpeed: json.hourly?.wind_speed_10m?.[hour] ?? 10,
      windDirection: json.hourly?.wind_direction_10m?.[hour] ?? 270,
    }
  }

  function buildPlumeFeature(event) {
    const { lat, lng } = event
    const { windSpeed, windDirection } = event.wind
    const plumeLength = windSpeed * 3

    const tip = destinationPoint(lat, lng, plumeLength, windDirection)
    const left = destinationPoint(lat, lng, plumeLength, windDirection - 22.5)
    const right = destinationPoint(lat, lng, plumeLength, windDirection + 22.5)
    const origin = [lng, lat]

    return {
      type: 'Feature',
      properties: { event_id: event.event_id },
      geometry: {
        type: 'Polygon',
        coordinates: [[origin, left, tip, right, origin]],
      },
    }
  }

  function citiesInPlume(event) {
    if (!event.wind) return []
    const { windDirection } = event.wind
    const plumeLength = event.plumeLength
    return CITIES.filter(city => {
      const dist = haversine(event.lat, event.lng, city.lat, city.lng)
      if (dist > plumeLength) return false
      const b = bearing(event.lat, event.lng, city.lat, city.lng)
      const diff = Math.abs(((b - windDirection + 180 + 360) % 360) - 180)
      return diff <= 22.5
    })
  }

  function updateLayer() {
    if (!map.getSource(SOURCE_ID)) return
    const features = Array.from(plumeCache.values())
    map.getSource(SOURCE_ID).setData({ type: 'FeatureCollection', features })
  }

  async function processEvents(evts) {
    if (processing) return
    processing = true

    // Re-apply cached wind data to re-created event objects (e.g. after polling)
    evts.forEach(event => {
      if (windCache.has(event.event_id) && !event.wind) {
        const cached = windCache.get(event.event_id)
        event.wind = cached.wind
        event.plumeLength = cached.plumeLength
        event.citiesInPlume = cached.citiesInPlume
      }
    })

    const pending = evts.filter(e => !plumeCache.has(e.event_id))
    // Stagger requests to avoid Open-Meteo rate limiting (max ~5 concurrent)
    for (let i = 0; i < pending.length; i += 5) {
      const batch = pending.slice(i, i + 5)
      await Promise.allSettled(batch.map(async event => {
        try {
          const wind = await fetchWind(event)
          event.wind = wind
          event.plumeLength = wind.windSpeed * 3
          event.citiesInPlume = citiesInPlume(event)
          windCache.set(event.event_id, { wind: event.wind, plumeLength: event.plumeLength, citiesInPlume: event.citiesInPlume })
          plumeCache.set(event.event_id, buildPlumeFeature(event))
          onPlumeData(event.event_id, { wind: event.wind, plumeLength: event.plumeLength, citiesInPlume: event.citiesInPlume })
        } catch {}
      }))
      if (i + 5 < pending.length) await new Promise(r => setTimeout(r, 300))
    }
    updateLayer()
    processing = false
  }

  function initLayers() {
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      map.addLayer({
        id: LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': 'rgba(255, 100, 0, 0.12)',
        },
      })
      map.addLayer({
        id: LAYER_OUTLINE_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': 'rgba(255, 100, 0, 0.6)',
          'line-width': 1,
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
      processEvents(events)
    }
    init()
  })

  $effect(() => {
    const evts = events
    if (initiated) processEvents(evts)
  })

  onDestroy(() => {
    if (map.getLayer(LAYER_OUTLINE_ID)) map.removeLayer(LAYER_OUTLINE_ID)
    if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
  })
</script>
