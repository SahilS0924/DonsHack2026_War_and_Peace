<script>
  import maplibregl from 'maplibre-gl'
  import { onDestroy } from 'svelte'

  let { map, events = [], onMarkerClick } = $props()
  let markers = []

  function getMarkerClass(type) {
    const t = type.toLowerCase()
    if (t.includes('drone')) return 'drone-marker'
    if (t.includes('intercept') || t.includes('defensive')) return 'drone-marker'
    if (t.includes('missile') || t.includes('ballistic') || t.includes('projectile')) return 'missile-marker'
    return 'strike-marker'
  }

  function getColor(type) {
    const t = type.toLowerCase()
    if (t.includes('drone')) return '#ffd700'
    if (t.includes('intercept') || t.includes('defensive')) return '#00ff88'
    if (t.includes('missile') || t.includes('ballistic') || t.includes('projectile')) return '#ff6b00'
    return '#ff2d2d'
  }

  function getSize(profile) {
    if (!profile) return 10
    return Math.max(8, Math.min(24, profile.impact_radius_min * 2))
  }

  function clearMarkers() {
    markers.forEach(m => m.remove())
    markers = []
  }

  $effect(() => {
    const _events = events
    clearMarkers()

    _events.forEach(event => {
      if (!event.lat || !event.lng) return
      const el = document.createElement('div')
      el.className = getMarkerClass(event.type)
      const size = getSize(event.profile)
      const color = getColor(event.type)
      el.style.cssText = `width:${size}px;height:${size}px;background:${color};border-radius:50%;cursor:pointer;box-shadow:0 0 ${size}px ${color}55;`
      el.addEventListener('click', () => onMarkerClick?.(event))

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([event.lng, event.lat])
        .addTo(map)
      markers.push(marker)
    })

    return () => clearMarkers()
  })

  onDestroy(() => clearMarkers())
</script>
