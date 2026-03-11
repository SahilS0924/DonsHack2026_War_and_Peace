<script>
  import { onMount } from 'svelte'
  import { loadFeed } from './data-pipeline/feed/feed.js'
  import { getProfile } from './data-pipeline/weapon-profiles/weaponProfiles.js'
  import { calculateCO2e } from './data-pipeline/co2-calc/co2Calc.js'
  import MapContainer from './map-core/base-map/MapContainer.svelte'
  import StrikeMarkers from './map-core/strike-markers/StrikeMarkers.svelte'
  import PlumeEngine from './environmental-layers/plume-engine/PlumeEngine.svelte'
  import NasaFires from './environmental-layers/nasa-fires/NasaFires.svelte'
  import AqiHalos from './environmental-layers/aqi-halos/AqiHalos.svelte'
  import Header from './ui/header/Header.svelte'
  import Sidebar from './ui/sidebar/Sidebar.svelte'
  import DetailPanel from './ui/detail-panel/DetailPanel.svelte'
  import Timeline from './ui/timeline/Timeline.svelte'

  let allEvents = $state([])
  let filteredEvents = $state([])
  let selectedEvent = $state(null)
  let map = $state.raw(null)
  let windDataMap = $state({})
  let lastStrikesFetch = $state(null)
  let lastFiresFetch = $state(null)
  let lastAqiFetch = $state(null)

  let selectedEventWithWind = $derived(
    selectedEvent
      ? { ...selectedEvent, ...(windDataMap[selectedEvent.event_id] ?? {}) }
      : null
  )

  function enrichEvents(raw) {
    return raw.map(e => {
      const profile = getProfile(e.type)
      return { ...e, profile, co2e_estimate: calculateCO2e(profile) }
    })
  }

  onMount(async () => {
    try {
      const raw = await loadFeed()
      allEvents = enrichEvents(raw)
      filteredEvents = allEvents
      lastStrikesFetch = Date.now()
    } catch {}

    setInterval(async () => {
      try {
        const fresh = await loadFeed()
        allEvents = enrichEvents(fresh)
        filteredEvents = allEvents
        lastStrikesFetch = Date.now()
      } catch {}
    }, 30 * 60 * 1000)
  })
</script>

<div class="fixed inset-0 bg-[#0a0a0a] font-mono">
  <MapContainer bind:map />

  {#if map}
    <PlumeEngine {map} events={allEvents} onPlumeData={(id, data) => windDataMap = { ...windDataMap, [id]: data }} />
    <AqiHalos {map} onAqiLoad={() => lastAqiFetch = Date.now()} />
    <NasaFires {map} onFiresLoad={() => lastFiresFetch = Date.now()} />
    <StrikeMarkers {map} events={filteredEvents} onMarkerClick={(e) => selectedEvent = e} />
  {/if}

  <Header events={filteredEvents} {lastStrikesFetch} {lastFiresFetch} {lastAqiFetch} />
  <Sidebar events={filteredEvents} {map} onEventClick={(e) => selectedEvent = e} />
  <DetailPanel event={selectedEventWithWind} onClose={() => selectedEvent = null} />
  <Timeline {allEvents} onFilter={(f) => filteredEvents = f} />

  <div class="scanline-overlay" aria-hidden="true"></div>
</div>
