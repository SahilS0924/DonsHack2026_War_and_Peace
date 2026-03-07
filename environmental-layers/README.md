# environmental-layers/

The core differentiator of ToxMap. While every other conflict tracker shows markers, we show what happens to the environment after the strike. This directory owns the three environmental data overlays.

## Subfolders

| Folder | File | Responsibility |
|---|---|---|
| `plume-engine/` | `PlumeEngine.svelte` | Open-Meteo wind fetch per strike → GeoJSON fill layer (plume cones) |
| `nasa-fires/` | `NasaFires.svelte` | NASA FIRMS CSV → GeoJSON circle layer (fire dots, flickering) |
| `aqi-halos/` | `AqiHalos.svelte` | AQICN 6-city fetch → GeoJSON circle layers (AQI halos) |

## Each component is a headless Svelte component

All three follow the same pattern: they receive `map` as a prop, add MapLibre sources and layers on mount, and update the data when their fetch refreshes. They render nothing to the DOM.

```svelte
<script>
  import { onMount, onDestroy } from 'svelte'

  let { map } = $props()

  onMount(() => {
    map.on('load', () => {
      map.addSource('my-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({ id: 'my-layer', type: 'fill', source: 'my-source', paint: { ... } })
      fetchAndUpdate()
    })
  })

  async function fetchAndUpdate() {
    const features = await fetchData()
    map.getSource('my-source').setData({ type: 'FeatureCollection', features })
  }

  onDestroy(() => {
    if (map.getLayer('my-layer')) map.removeLayer('my-layer')
    if (map.getSource('my-source')) map.removeSource('my-source')
  })
</script>
```

## Layer order in MapLibre

MapLibre draws layers in the order they are added. Add them in this order so strike markers end up on top:

1. Add `plumes-fill` layer (widest, drawn first — underneath everything)
2. Add `aqi-halos` layer (large transparent circles)
3. Add `fires-circle` layer (small points)
4. HTML strike markers are always on top (they're DOM elements, above the canvas)

Each Svelte component is mounted in the correct order in `App.svelte`.

## Polling intervals

| Layer | Interval |
|---|---|
| Plumes | Refresh with strike data every 30 min |
| NASA fires | Every 10 minutes |
| AQI | Every 1 hour |

Each component manages its own polling interval in `onMount`. Cancel with `clearInterval` in `onDestroy`.

## Dependencies

All three receive `map` from `App.svelte`. `PlumeEngine` also receives `events` as a prop. `NasaFires` and `AqiHalos` fetch their own data independently.
