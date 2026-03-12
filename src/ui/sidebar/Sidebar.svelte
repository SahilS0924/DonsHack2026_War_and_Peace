<script>
  let { events = [], map, onEventClick } = $props()

  const FILTERS = ['ALL', 'AIR', 'MISS', 'DRONE', 'INTER']
  let activeFilter = $state('ALL')

  function matchesFilter(type, filter) {
    const t = type.toLowerCase()
    if (filter === 'ALL') return true
    if (filter === 'AIR') return (t.includes('airstrike') || t.includes('air strike') || t.includes('bombardment') || t.includes('bombing')) && !t.includes('missile')
    if (filter === 'MISS') return t.includes('missile') || t.includes('ballistic') || t.includes('projectile')
    if (filter === 'DRONE') return t.includes('drone')
    if (filter === 'INTER') return t.includes('intercept') || t.includes('defensive')
    return true
  }

  let visibleEvents = $derived(events.filter(e => matchesFilter(e.type, activeFilter)))

  function getColor(type) {
    const t = type.toLowerCase()
    if (t.includes('drone')) return '#ffd700'
    if (t.includes('intercept') || t.includes('defensive')) return '#00ff88'
    if (t.includes('missile') || t.includes('ballistic') || t.includes('projectile')) return '#ff6b00'
    return '#ff2d2d'
  }

  function formatTime(ts) {
    const d = new Date(ts)
    return d.toISOString().slice(0, 16).replace('T', ' ') + 'Z'
  }

  function handleCardClick(event) {
    onEventClick?.(event)
    map?.flyTo({ center: [event.lng, event.lat], zoom: 8, duration: 1200 })
  }
</script>

<aside class="fixed top-[41px] left-0 bottom-[60px] z-[400] w-[280px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex flex-col">
  <!-- Filter buttons -->
  <div class="flex gap-0 border-b border-[#1a1a1a] shrink-0">
    {#each FILTERS as f}
      <button
        class="flex-1 py-2 text-[10px] tracking-widest transition-colors {activeFilter === f ? 'text-toxorange bg-[#1a1a1a]' : 'text-[#555] hover:text-[#888]'}"
        onclick={() => activeFilter = f}
      >{f}</button>
    {/each}
  </div>

  <!-- Count -->
  <div class="px-3 py-1 border-b border-[#1a1a1a] text-[10px] text-[#555] shrink-0">
    {visibleEvents.length} events
  </div>

  <!-- Event list -->
  <div class="overflow-y-auto flex-1">
    {#each visibleEvents as event (event.event_id)}
      {@const color = getColor(event.type)}
      <button
        class="w-full text-left px-3 py-2 border-b border-[#111] hover:bg-[#111] transition-colors cursor-pointer"
        onclick={() => handleCardClick(event)}
      >
        <div class="flex items-start gap-2">
          <span class="mt-1 w-2 h-2 rounded-full shrink-0 inline-block" style="background:{color};box-shadow:0 0 6px {color}66;"></span>
          <div class="flex-1 min-w-0">
            <div class="text-[11px] text-[#ccc] leading-tight truncate">{event.type}</div>
            <div class="text-[10px] text-[#555] mt-0.5 leading-tight line-clamp-2">{event.event_summary}</div>
            <div class="text-[9px] text-[#333] mt-1">{formatTime(event.timestamp)}</div>
            {#if event.confidence}
              <div class="text-[9px] mt-0.5 text-[#555]">CONF: <span class="text-[#888]">{event.confidence}</span></div>
            {/if}
            {#if event.co2e_estimate}
              <div class="text-[9px] mt-0.5" style="color:{color}55;">{event.co2e_estimate.toLocaleString()} kg CO\u2082e est.</div>
            {/if}
          </div>
        </div>
      </button>
    {/each}

    {#if visibleEvents.length === 0}
      <div class="px-3 py-6 text-[11px] text-[#333] text-center">NO EVENTS</div>
    {/if}
  </div>
</aside>
