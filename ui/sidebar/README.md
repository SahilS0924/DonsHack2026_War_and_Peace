# ui/sidebar/

The left panel. Scrollable list of strike events with filter buttons at the top. Clicking a card flies the map to that location and opens the detail panel.

## What to build

### File: `Sidebar.svelte`

Receives `events` (filtered), `map` (MapLibre instance), and `onEventClick` callback.

---

## Implementation

```svelte
<script>
  let { events = [], map, onEventClick } = $props()

  // Active filter — 'ALL' | 'airstrike' | 'missile' | 'drone' | 'intercept'
  let activeFilter = $state('ALL')

  const FILTERS = [
    { label: 'ALL',   value: 'ALL' },
    { label: 'AIR',   value: 'airstrike' },
    { label: 'MISS',  value: 'missile' },
    { label: 'DRONE', value: 'drone' },
    { label: 'INTER', value: 'intercept' },
  ]

  // Derive visible events from active filter — updates automatically
  let visibleEvents = $derived(
    activeFilter === 'ALL'
      ? events
      : events.filter(e => getTypeGroup(e.type) === activeFilter)
  )

  function getTypeGroup(type) {
    const t = type.toLowerCase()
    if (t.includes('airstrike') || t.includes('air strike') || t.includes('bombardment')) return 'airstrike'
    if (t.includes('missile') || t.includes('ballistic') || t.includes('naval')) return 'missile'
    if (t.includes('drone')) return 'drone'
    if (t.includes('intercept') || t.includes('defensive')) return 'intercept'
    return 'other'
  }

  function getTypeColor(type) {
    const group = getTypeGroup(type)
    const colors = {
      airstrike: '#ff2d2d',
      missile:   '#ff6b00',
      drone:     '#ffd700',
      intercept: '#00ff88',
      other:     '#ffffff',
    }
    return colors[group]
  }

  function formatTime(iso) {
    const d = new Date(iso)
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    const month  = months[d.getUTCMonth()]
    const day    = String(d.getUTCDate()).padStart(2, '0')
    const hour   = String(d.getUTCHours()).padStart(2, '0')
    const min    = String(d.getUTCMinutes()).padStart(2, '0')
    return `${month} ${day} · ${hour}:${min} UTC`
  }

  function parseLocation(summary) {
    const patterns = [
      /(?:strikes?|targeting|struck|hit|attack(?:ed|s)?)\s+(.+?)(?:\.|,|$)/i,
      /(?:in|near|at|over)\s+(.+?)(?:\.|,|$)/i,
    ]
    for (const p of patterns) {
      const m = summary.match(p)
      if (m) return m[1].trim().slice(0, 38)
    }
    return summary.slice(0, 38)
  }

  function handleCardClick(event) {
    // Fly map to event location
    map?.flyTo({ center: [event.lng, event.lat], zoom: 8, duration: 1000 })
    onEventClick(event)
  }
</script>

<aside class="fixed top-12 left-0 w-[280px] bottom-14 bg-[#0a0a0a]/90 border-r border-[#1a1a1a] z-[400] flex flex-col font-mono">

  <!-- Filter buttons -->
  <div class="flex gap-1 p-2 border-b border-[#1a1a1a] shrink-0">
    {#each FILTERS as f}
      <button
        class="flex-1 text-[10px] tracking-widest uppercase border px-1 py-1 cursor-pointer transition-colors
               {activeFilter === f.value
                 ? 'border-[#ff2d2d] text-[#ff2d2d]'
                 : 'border-[#222] text-[#444] hover:border-[#555] hover:text-[#666]'}"
        onclick={() => activeFilter = f.value}
      >
        {f.label}
      </button>
    {/each}
  </div>

  <!-- Event list -->
  <div class="overflow-y-auto flex-1">
    {#each visibleEvents as event (event.event_id)}
      {@const color = getTypeColor(event.type)}
      <div
        class="px-3 py-2.5 border-b border-[#0f0f0f] cursor-pointer hover:bg-[#111] transition-colors"
        onclick={() => handleCardClick(event)}
        role="button"
        tabindex="0"
        onkeydown={(e) => e.key === 'Enter' && handleCardClick(event)}
      >
        <!-- Type badge -->
        <div
          class="inline-block text-[8px] font-bold uppercase tracking-[2px] px-1.5 py-0.5 mb-1.5 text-[#0a0a0a]"
          style="background: {color}"
        >
          {event.type}
        </div>

        <!-- Location -->
        <div class="text-[12px] text-[#ddd] truncate mb-0.5">
          {parseLocation(event.event_summary)}
        </div>

        <!-- Time -->
        <div class="text-[10px] text-[#444] mb-0.5">
          {formatTime(event.timestamp)}
        </div>

        <!-- Confidence + casualties -->
        <div class="flex justify-between text-[9px]">
          <span class="text-[#555]">{event.confidence}</span>
          <span class="text-[#ff6b00]">{event.casualties} KIA</span>
        </div>
      </div>
    {/each}

    {#if visibleEvents.length === 0}
      <div class="text-[#333] text-[11px] text-center mt-8 px-4">
        NO EVENTS MATCH FILTER
      </div>
    {/if}
  </div>

</aside>
```

---

## Key Svelte 5 pattern here

`visibleEvents` is `$derived` from both `events` (the prop from App) and `activeFilter` (local `$state`). When either changes — timeline scrub updates `events`, or user clicks a filter button — `visibleEvents` updates automatically. No manual event handling needed.

---

## What NOT to do

- Do not manage visibility by toggling `display: none` on cards — use `$derived` to filter the array
- Do not call `map.addLayer()` or modify map data here — only `map.flyTo()`
- Do not fetch data in the sidebar

---

## Test it

After mounting with events:
- Scrollable list of ~35 event cards in the left panel
- Filter buttons work: click AIR → only airstrike cards visible, counter reflects subset
- Clicking a card flies the map to that location (MapLibre animates smoothly)
- When parent updates `events` (timeline scrub), the list updates immediately
