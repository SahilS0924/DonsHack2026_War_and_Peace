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
    return () => map?.remove()
  })
</script>

<div bind:this={container} class="fixed inset-0 z-[1]"></div>
