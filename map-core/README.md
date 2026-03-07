# map-core/

Owns the MapLibre GL JS map instance and everything plotted directly as strike data. This is the WebGL canvas foundation every other visual layer is built on.

## Subfolders

| Folder | File | Responsibility |
|---|---|---|
| `base-map/` | `MapContainer.svelte` | Initialize MapLibre, load CartoDB Dark Matter style, bind map instance to App via `bind:map` |
| `strike-markers/` | `StrikeMarkers.svelte` | HTML custom markers per event with CSS pulse animations, click handlers |

## MapLibre vs Leaflet — key differences

This is NOT Leaflet. Critical differences:

| | MapLibre GL JS | Leaflet (old) |
|---|---|---|
| Rendering | WebGL (GPU) | SVG/Canvas (CPU) |
| Coordinate order | `[longitude, latitude]` | `[latitude, longitude]` |
| Layers | GeoJSON sources + layer definitions | L.polygon(), L.circle(), etc. |
| Map init | `new maplibregl.Map({ container, style, center: [lng, lat] })` | `L.map(id).setView([lat, lng])` |
| Move to location | `map.flyTo({ center: [lng, lat] })` | `map.flyTo([lat, lng])` |

**Always write coordinates as `[longitude, latitude]` in MapLibre.**

## The map instance

`MapContainer.svelte` creates the map and exposes it to `App.svelte` via `bind:map`. Every child component that needs the map receives it as a prop from App.

```svelte
<!-- In App.svelte -->
<MapContainer bind:map />
{#if map}
  <PlumeEngine {map} events={filteredEvents} />
  <StrikeMarkers {map} events={filteredEvents} onMarkerClick={...} />
{/if}
```

The `{#if map}` guard is critical. Child components cannot add layers until the map exists and its style has loaded.

## What map-core does NOT do

- Does not fetch data
- Does not draw plumes, fires, or AQI — those live in `environmental-layers/`
- Does not render sidebar or detail panel — those live in `ui/`

## Build order

Build `base-map/` first. `strike-markers/` depends on it.
