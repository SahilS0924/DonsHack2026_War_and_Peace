<script>
  import { onMount } from 'svelte'
  import maplibregl from 'maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'

  let { map = $bindable(null) } = $props()
  let container

  onMount(() => {
    map = new maplibregl.Map({
      container,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [50, 32],
      zoom: 5,
      attributionControl: false,
    })
    map.on('error', (e) => console.error('[MapLibre error]', e.error))
    return () => map?.remove()
  })
</script>

<div class="fixed inset-0 z-[1]">
  <div bind:this={container} style="width:100%;height:100%;"></div>
</div>
