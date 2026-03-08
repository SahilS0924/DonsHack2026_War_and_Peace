<script>
  import maplibregl from 'maplibre-gl'
  import { onDestroy } from 'svelte'

  let { map, events = [], onMarkerClick } = $props()

  const TYPE_COLORS = {
    Airstrike: '#ff2d2d',
    'Air Strike': '#ff2d2d',
    'Airstrikes/Bombardment': '#ff2d2d',
    'Ballistic Missile Strike': '#ff6b00',
    'Missile Strike': '#ff6b00',
    'Missile attack (intercepted)': '#ff6b00',
    'Drone strike': '#ffd700',
    'Drone Attack': '#ffd700',
    Interception: '#00ff88',
    'Defensive Fire': '#00ff88',
  }

  const TYPE_CLASS = {
    Airstrike: 'strike-marker',
    'Air Strike': 'strike-marker',
    'Ballistic Missile Strike': 'missile-marker',
    'Missile Strike': 'missile-marker',
    'Drone strike': 'drone-marker',
    'Drone Attack': 'drone-marker',
  }

  let markers = []

  function getColor(type) {
    return TYPE_COLORS[type] ?? '#ffffff'
  }

  function getClass(type) {
    return TYPE_CLASS[type] ?? 'strike-marker'
  }

  function getSize(profile) {
    if (!profile) return 12
    const avgKm = (profile.impact_radius_min + profile.impact_radius_max) / 2
    return Math.max(8, Math.min(24, Math.round(avgKm * 2.5)))
  }

  function clearMarkers() {
    markers.forEach((m) => m.remove())
    markers = []
  }

  function plotMarkers(eventList) {
    clearMarkers()
    if (!map) return
    eventList.forEach((event) => {
      const color = getColor(event.type)
      const size = getSize(event.profile)
      const animClass = getClass(event.type)
      const el = document.createElement('div')
      el.className = animClass
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: 1.5px solid ${color};
        box-shadow: 0 0 ${size}px ${color}40;
        cursor: pointer;
      `
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onMarkerClick?.(event)
      })
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([event.lng, event.lat])
        .addTo(map)
      markers.push(marker)
    })
  }

  $effect(() => {
    if (!map) return
    plotMarkers(events)
    return () => clearMarkers()
  })

  onDestroy(() => clearMarkers())
</script>
