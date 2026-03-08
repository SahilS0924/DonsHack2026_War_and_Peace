<script>
  import { onMount, onDestroy } from 'svelte'

  let { map, events = [], onPlumeData } = $props()

  const SOURCE_ID = 'plumes'
  const LAYER_ID = 'plumes-fill'
  let layerReady = false

  const CITIES = [
    { name: 'Tehran', lat: 35.6892, lng: 51.3890, population: 9200000 },
    { name: 'Baghdad', lat: 33.3152, lng: 44.3661, population: 7200000 },
    { name: 'Tel Aviv', lat: 32.0853, lng: 34.7818, population: 4300000 },
    { name: 'Beirut', lat: 33.8938, lng: 35.5018, population: 2200000 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708, population: 3400000 },
    { name: 'Kuwait City', lat: 29.3759, lng: 47.9774, population: 3100000 },
    { name: 'Riyadh', lat: 24.7136, lng: 46.6753, population: 7600000 },
    { name: 'Doha', lat: 25.2854, lng: 51.5310, population: 2400000 },
  ]

  async function fetchWindForEvent(event) {
    const date = event.timestamp.split('T')[0]
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${event.lat}&longitude=${event.lng}&start_date=${date}&end_date=${date}&hourly=wind_speed_10m,wind_direction_10m`
    try {
      const res = await fetch(url)
      const data = await res.json()
      const hour = new Date(event.timestamp).getUTCHours()
      return {
        windSpeed: data.hourly?.wind_speed_10m?.[hour] ?? 15,
        windDirection: data.hourly?.wind_direction_10m?.[hour] ?? 270,
      }
    } catch {
      return { windSpeed: 15, windDirection: 270 }
    }
  }

  function destinationPoint(lat, lng, distKm, bearing) {
    const R = 6371
    const b = (bearing * Math.PI) / 180
    const lat1 = (lat * Math.PI) / 180
    const lng1 = (lng * Math.PI) / 180
    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distKm / R) + Math.cos(lat1) * Math.sin(distKm / R) * Math.cos(b)
    )
    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(b) * Math.sin(distKm / R) * Math.cos(lat1),
        Math.cos(distKm / R) - Math.sin(lat1) * Math.sin(lat2)
      )
    return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI]
  }

  function buildPlumeFeature(lat, lng, windSpeed, windDirection) {
    const plumeLength = windSpeed * 3
    if (plumeLength < 1) return null
    const halfAngle = 22.5
    const tipLeft = destinationPoint(lat, lng, plumeLength, (windDirection - halfAngle + 360) % 360)
    const tipRight = destinationPoint(lat, lng, plumeLength, (windDirection + halfAngle + 360) % 360)
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [lng, lat],
            [tipLeft[1], tipLeft[0]],
            [tipRight[1], tipRight[0]],
            [lng, lat],
          ],
        ],
      },
      properties: { windSpeed, windDirection },
    }
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  function bearingTo(lat1, lng1, lat2, lng2) {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180)
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng)
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  function citiesInPlumeForEvent(event, windSpeed, windDirection) {
    const plumeLength = windSpeed * 3
    return CITIES.filter((city) => {
      const dist = haversineKm(event.lat, event.lng, city.lat, city.lng)
      if (dist > plumeLength) return false
      const bearing = bearingTo(event.lat, event.lng, city.lat, city.lng)
      const diff = Math.abs((((bearing - windDirection) + 180 + 360) % 360) - 180)
      return diff <= 22.5
    })
  }

  function initLayer() {
    if (map.getSource(SOURCE_ID)) return
    map.addSource(SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    map.addLayer({
      id: LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      paint: {
        'fill-color': 'rgba(255, 100, 0, 0.12)',
        'fill-outline-color': 'rgba(255, 100, 0, 0.6)',
      },
    })
    layerReady = true
    if (events.length) drawPlumes(events)
  }

  async function drawPlumes(eventList) {
    if (!layerReady || !map?.getSource(SOURCE_ID)) return
    const windResults = await Promise.all(eventList.map((e) => fetchWindForEvent(e)))
    const features = []
    const nextMetaById = {}
    eventList.forEach((event, i) => {
      const { windSpeed, windDirection } = windResults[i]
      nextMetaById[event.event_id] = {
        wind: { windSpeed, windDirection },
        plumeLength: Math.round(windSpeed * 3),
        citiesInPlume: citiesInPlumeForEvent(event, windSpeed, windDirection),
      }
      const feature = buildPlumeFeature(event.lat, event.lng, windSpeed, windDirection)
      if (feature) features.push(feature)
    })
    map.getSource(SOURCE_ID)?.setData({ type: 'FeatureCollection', features })
    onPlumeData?.(nextMetaById)
  }

  onMount(() => {
    if (!map) return
    if (map.isStyleLoaded()) initLayer()
    else map.once('load', initLayer)
  })

  $effect(() => {
    const currentEvents = events
    if (!map || !layerReady) return
    if (!currentEvents.length) {
      onPlumeData?.({})
      map.getSource(SOURCE_ID)?.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    drawPlumes(currentEvents)
  })

  onDestroy(() => {
    try {
      if (map?.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map?.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    } catch {}
  })
</script>
