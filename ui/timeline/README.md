# ui/timeline/

The bottom date scrubber. Drag the thumb to filter which events are shown on the map and in the sidebar. Uses Svelte 5 `$state` for the current position and calls `onFilter` whenever the cutoff date changes.

## What to build

### File: `Timeline.svelte`

Receives `allEvents` (the full unfiltered array) and `onFilter` callback. Internally manages drag state. Calls `onFilter(filteredSubset)` on every drag update.

---

## Implementation

```svelte
<script>
  let { allEvents = [], onFilter } = $props()

  const START_DATE = new Date('2026-02-28T00:00:00Z')
  const END_DATE   = new Date()  // today at mount time

  let pct = $state(1)       // 0.0 = Feb 28, 1.0 = today
  let isDragging = $state(false)
  let trackEl = $state(null)

  // Day labels for the scrubber
  let dayLabels = $derived((() => {
    const labels = []
    let d = new Date(START_DATE)
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    while (d <= END_DATE) {
      const p = (d - START_DATE) / (END_DATE - START_DATE) * 100
      labels.push({ label: `${months[d.getUTCMonth()]} ${d.getUTCDate()}`, pct: p })
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
    }
    return labels
  })())

  // Filter events whenever pct changes
  $effect(() => {
    const cutoff = new Date(START_DATE.getTime() + pct * (END_DATE - START_DATE))
    onFilter(allEvents.filter(e => new Date(e.timestamp) <= cutoff))
  })

  function updateFromClientX(clientX) {
    if (!trackEl) return
    const rect = trackEl.getBoundingClientRect()
    const newPct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    pct = newPct
  }

  function onMouseDown(e) {
    isDragging = true
    updateFromClientX(e.clientX)
  }

  function onMouseMove(e) {
    if (!isDragging) return
    updateFromClientX(e.clientX)
  }

  function onMouseUp() { isDragging = false }

  function onTouchStart(e) {
    isDragging = true
    updateFromClientX(e.touches[0].clientX)
  }

  function onTouchMove(e) {
    if (!isDragging) return
    e.preventDefault()
    updateFromClientX(e.touches[0].clientX)
  }
</script>

<!-- Global mouse/touch listeners for drag (handles mouse leaving track element) -->
<svelte:window
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  ontouchmove={onTouchMove}
  ontouchend={onMouseUp}
/>

<div class="fixed bottom-0 left-[280px] right-0 h-14 bg-[#0a0a0a]/90 border-t border-[#1a1a1a] z-[200] flex flex-col justify-center px-6 font-mono">

  <!-- Day labels -->
  <div class="relative h-4 mb-1">
    {#each dayLabels as { label, pct: p }}
      <span
        class="absolute text-[9px] text-[#2a2a2a] uppercase tracking-wide whitespace-nowrap -translate-x-1/2"
        style="left: {p}%"
      >
        {label}
      </span>
    {/each}
  </div>

  <!-- Track -->
  <div
    bind:this={trackEl}
    class="relative h-1 bg-[#1a1a1a] cursor-pointer"
    onmousedown={onMouseDown}
    ontouchstart={onTouchStart}
    role="slider"
    aria-valuenow={Math.round(pct * 100)}
    aria-valuemin={0}
    aria-valuemax={100}
    tabindex="0"
  >
    <!-- Fill (left of thumb) -->
    <div
      class="absolute top-0 left-0 h-full bg-[#ff2d2d]"
      style="width: {pct * 100}%"
    ></div>

    <!-- Thumb -->
    <div
      class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#ff2d2d] border-2 border-[#0a0a0a] cursor-grab active:cursor-grabbing"
      style="left: {pct * 100}%"
    ></div>
  </div>

</div>
```

---

## How the filter works

`$effect` watches `pct` and `allEvents`. Whenever either changes, it:
1. Computes the cutoff timestamp (`START + pct * range`)
2. Filters `allEvents` to only events before that cutoff
3. Calls `onFilter(filtered)` → App updates `filteredEvents = filtered`
4. → StrikeMarkers, Sidebar, Header all re-render reactively

This is the Svelte 5 way: pure reactive data flow with no imperative glue code.

---

## `<svelte:window>` for global drag

The `onmousemove` and `onmouseup` listeners are on `<svelte:window>` (not the track div). This is critical — without it, the drag breaks if the mouse moves off the track element during drag. Svelte's `<svelte:window>` attaches to the actual `window` object and auto-cleans up on component destroy.

---

## What NOT to do

- Do not re-fetch data when scrubber moves — filter the already-loaded `allEvents` array
- Do not re-draw plumes when scrubber moves — only markers and sidebar update
- Do not add `e.preventDefault()` globally — only for `touchmove` to prevent page scroll during drag
- Do not use `document.addEventListener` — use `<svelte:window>` instead (Svelte handles cleanup)

---

## Test it

After mounting with allEvents:
- Scrubber bar visible at bottom of screen
- Day labels `FEB 28 · MAR 1 · ... · MAR 7` evenly spaced
- Dragging thumb left → sidebar cards disappear, map markers disappear, header counts drop
- Dragging to MAR 4 → only events before MAR 4 visible
- Dragging back to right → all events visible again
- Works on touch (mobile)
