# map-core/strike-markers/

Renders HTML custom markers on the MapLibre map for each strike event. Uses CSS animations (pulse) for the military aesthetic. Handles click events that set the selected event in the parent.

We use **HTML custom markers** (not MapLibre GeoJSON circle layers) because CSS `@keyframes` animations only work on DOM elements, not WebGL layers.

## What to build

### File: `StrikeMarkers.svelte`

A Svelte component that:
1. Receives `events` and `map` as props
2. Reactively adds/removes markers when `events` changes (via `$effect`)
3. Calls `onMarkerClick(event)` on click

---

## Implementation

```svelte
<script>
  import maplibregl from 'maplibre-gl'
  import { onDestroy } from 'svelte'

  let { map, events = [], onMarkerClick } = $props()

  // Track created markers so we can remove them on update
  let markers = []

  // Color map
  const TYPE_COLORS = {
    'Airstrike':                              '#ff2d2d',
    'Air Strike':                             '#ff2d2d',
    'Airstrikes/Bombardment':                 '#ff2d2d',
    'Airstrikes/Bombing (Cumulative Impact)': '#ff2d2d',
    'Ballistic Missile Strike':               '#ff6b00',
    'Missile Strike':                         '#ff6b00',
    'Missile attack (intercepted)':           '#ff6b00',
    'Missile/Projectile attack':              '#ff6b00',
    'Naval Strike':                           '#ff6b00',
    'Drone strike':                           '#ffd700',
    'Drone Attack':                           '#ffd700',
    'Interception':                           '#00ff88',
    'Defensive Fire':                         '#00ff88',
    'Ground Incursion':                       '#00ff88',
  }

  // Animation class map
  const TYPE_CLASS = {
    'Airstrike':               'strike-marker',
    'Air Strike':              'strike-marker',
    'Airstrikes/Bombardment':  'strike-marker',
    'Ballistic Missile Strike':'missile-marker',
    'Missile Strike':          'missile-marker',
    'Drone strike':            'drone-marker',
    'Drone Attack':            'drone-marker',
  }

  function getColor(type) { return TYPE_COLORS[type] ?? '#ffffff' }
  function getClass(type) { return TYPE_CLASS[type] ?? 'strike-marker' }

  function getSize(profile) {
    // Scale marker size proportional to impact radius
    const avgKm = (profile.impact_radius_min + profile.impact_radius_max) / 2
    return Math.max(8, Math.min(24, Math.round(avgKm * 2.5)))  // px, capped 8-24
  }

  function clearMarkers() {
    markers.forEach(m => m.remove())
    markers = []
  }

  function plotMarkers(eventList) {
    clearMarkers()
    eventList.forEach(event => {
      const color = getColor(event.type)
      const size = getSize(event.profile)
      const animClass = getClass(event.type)

      // Create custom HTML element
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
        onMarkerClick(event)
      })

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([event.lng, event.lat])  // [longitude, latitude]
        .addTo(map)

      markers.push(marker)
    })
  }

  // Re-render markers whenever events prop changes
  $effect(() => {
    if (!map) return
    plotMarkers(events)

    return () => clearMarkers()  // cleanup on unmount or re-run
  })

  onDestroy(() => clearMarkers())
</script>

<!-- This component renders nothing to the DOM — all output goes into the MapLibre canvas -->
```

---

## CSS — pulse animations

Add to `src/assets/styles/app.css`. These animate the HTML marker elements:

```css
@keyframes pulse {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(1.6); opacity: 0.6; }
  100% { transform: scale(1);   opacity: 1; }
}

.strike-marker  { animation: pulse 2.0s ease-in-out infinite; }
.missile-marker { animation: pulse 2.5s ease-in-out infinite; }
.drone-marker   { animation: pulse 3.0s ease-in-out infinite; }
```

The `box-shadow` on each marker creates a glow that pulses with the animation.

---

## Color coding

| Event category | Color | Hex |
|---|---|---|
| Airstrikes | Red | `#ff2d2d` |
| Missiles / Naval | Orange | `#ff6b00` |
| Drones | Yellow | `#ffd700` |
| Interceptions / Defensive | Green | `#00ff88` |

---

## Usage in App.svelte

```svelte
{#if map}
  <StrikeMarkers
    {map}
    events={filteredEvents}
    onMarkerClick={(event) => selectedEvent = event}
  />
{/if}
```

When `filteredEvents` changes (e.g., timeline scrub), `$effect` reruns automatically — markers clear and redraw.

---

## What NOT to do

- Do not use MapLibre GeoJSON circle layers for markers — CSS animations won't work
- Do not use `L.circleMarker` — this is not Leaflet
- Do not manage markers with a GeoJSON source — HTML markers give us animation
- Do not fetch data here
- Do not draw plumes or fires here

---

## Test it

After mounting with events:
- ~35 colored dots appear over Middle East cities
- Each dot pulses continuously (CSS animation)
- Red = airstrikes, orange = missiles, yellow = drones, green = interceptions
- Clicking a dot calls `onMarkerClick` with the event object
- When `events` prop changes, old markers are removed and new ones appear
