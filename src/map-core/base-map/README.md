# map-core/base-map/

Initializes MapLibre GL JS with CartoDB Dark Matter WebGL tiles, centered on the Middle East. Exposes the map instance to the parent via Svelte's `bind:map`.

## What to build

### File: `MapContainer.svelte`

A Svelte component that:
1. Renders a full-screen div for the map
2. Initializes MapLibre in `onMount`
3. Exposes the map instance upward via `$bindable()`

---

## Implementation

```svelte
<script>
  import maplibregl from 'maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'
  import { onMount, onDestroy } from 'svelte'

  // Expose map instance to parent via bind:map
  let { map = $bindable(null) } = $props()

  let container  // bound to the div element

  onMount(() => {
    map = new maplibregl.Map({
      container,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [50, 32],    // [longitude, latitude] — center of Middle East
      zoom: 5,
      attributionControl: false,
      logoPosition: 'bottom-right',
    })

    // Map is ready — parent's {#if map} guard now passes
    // Child components (PlumeEngine, StrikeMarkers, etc.) will mount next tick
  })

  onDestroy(() => {
    map?.remove()
    map = null
  })
</script>

<!-- Full-screen map canvas behind all UI panels -->
<div
  bind:this={container}
  class="fixed inset-0 z-[1]"
></div>
```

---

## Usage in App.svelte

```svelte
<script>
  import MapContainer from './map-core/base-map/MapContainer.svelte'
  let map = $state(null)
</script>

<MapContainer bind:map />

{#if map}
  <!-- All layers go here, receive map as prop -->
  <StrikeMarkers {map} events={filteredEvents} onMarkerClick={...} />
  <PlumeEngine {map} events={filteredEvents} />
  <NasaFires {map} />
  <AqiHalos {map} />
{/if}
```

The `{#if map}` guard is required. Child components must not mount until the map instance exists.

---

## Map coverage

Center `[50, 32]` at zoom 5 covers:
- West: ~30° — Tel Aviv, Beirut, Damascus
- East: ~70° — Mashhad, eastern Iran
- South: ~20° — Dubai, Abu Dhabi
- North: ~44° — Tabriz, northern Iran

This is the exact region of all conflict events.

---

## CartoDB Dark Matter style URL

```
https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
```

This is the MapLibre-compatible style JSON for CartoDB Dark Matter. Free, no API key. Pure black with subtle geographic features — perfect for the military aesthetic.

Do not replace this with any other tile source.

---

## CSS for the map container

The map div uses Tailwind `fixed inset-0 z-[1]`. All UI panels float above it at higher z-index:
- Sidebar: `z-[400]`
- Detail panel: `z-[500]`
- Header: `z-[1000]`
- Timeline: `z-[200]`
- Scanline overlay: `z-[9999]`

---

## What NOT to do

- Do not add markers or layers here — that's for child components
- Do not use a string ID for the container — use `bind:this={container}` (DOM element reference)
- Do not load MapLibre CSS anywhere else — import it here once
- Do not use Leaflet — this project uses MapLibre GL JS v4

---

## Test it

After mounting `MapContainer`:
- A pure black map of the Middle East renders
- Map is pannable and zoomable
- `map` prop is non-null in parent (the `{#if map}` guard passes)
- No white background flash on load (CartoDB dark style loads instantly)
