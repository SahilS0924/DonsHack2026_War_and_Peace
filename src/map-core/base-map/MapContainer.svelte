<script>
  import maplibregl from 'maplibre-gl'
  import 'maplibre-gl/dist/maplibre-gl.css'
  import { onMount, onDestroy } from 'svelte'

  let { map = $bindable(null) } = $props()
  let container

  const PRIMARY_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  const FALLBACK_STYLE = 'https://demotiles.maplibre.org/style.json'

  onMount(() => {
    map = new maplibregl.Map({
      container,
      style: PRIMARY_STYLE,
      center: [50, 32],
      zoom: 5,
      attributionControl: false,
      logoPosition: 'bottom-right',
    })

    // If Carto style/tiles are blocked, swap to a known public fallback.
    let switchedToFallback = false
    map.on('error', () => {
      if (switchedToFallback) return
      switchedToFallback = true
      try {
        map.setStyle(FALLBACK_STYLE)
      } catch {}
    })

    // Force size synchronization to avoid blank/black canvas caused by stale dimensions.
    const resizeMap = () => {
      try {
        map?.resize()
      } catch {}
    }

    map.on('load', resizeMap)
    map.on('styledata', resizeMap)
    window.addEventListener('resize', resizeMap)
    setTimeout(resizeMap, 0)
    setTimeout(resizeMap, 300)
    setTimeout(resizeMap, 1000)

    return () => {
      window.removeEventListener('resize', resizeMap)
    }
  })

  onDestroy(() => {
    map?.remove()
    map = null
  })
</script>

<div bind:this={container} class="fixed inset-0 z-[1] w-screen h-screen"></div>
