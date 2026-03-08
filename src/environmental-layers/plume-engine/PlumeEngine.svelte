<script>
  import { onMount, onDestroy } from 'svelte'

  let { map, events = [] } = $props()

  const SOURCE_ID = 'plumes'
  const LAYER_ID = 'plumes-fill'

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
  }

  async function drawPlumes(eventList) {
    const windResults = await Promise.all(eventList.map((e) => fetchWindForEvent(e)))
    const features = []
    eventList.forEach((event, i) => {
      const { windSpeed, windDirection } = windResults[i]
      event.wind = { windSpeed, windDirection }
      event.plumeLength = Math.round(windSpeed * 3)
      event.citiesInPlume = []
      const feature = buildPlumeFeature(event.lat, event.lng, windSpeed, windDirection)
      if (feature) features.push(feature)
    })
    map.getSource(SOURCE_ID)?.setData({ type: 'FeatureCollection', features })
  }

  onMount(() => {
    if (!map) return
    if (map.isStyleLoaded()) initLayer()
    else map.once('load', initLayer)
  })

  $effect(() => {
    const currentEvents = events
    if (!map || !currentEvents.length) return
    if (!map.getSource(SOURCE_ID)) return
    drawPlumes(currentEvents)
  })

  onDestroy(() => {
    try {
      if (map?.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      if (map?.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
    } catch {}
  })
</script>
