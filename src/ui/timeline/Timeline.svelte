<script>
  let { allEvents = [], onFilter } = $props()

  let pct = $state(1.0)
  let dragging = $state(false)
  let barEl = $state(null)

  let startTime = $derived(
    allEvents.length > 0
      ? Math.min(...allEvents.map(e => new Date(e.timestamp).getTime()))
      : new Date('2026-02-28').getTime()
  )
  let endTime = $derived(
    allEvents.length > 0
      ? Math.max(...allEvents.map(e => new Date(e.timestamp).getTime()))
      : Date.now()
  )

  let cutoff = $derived(startTime + pct * (endTime - startTime))
  let filtered = $derived(allEvents.filter(e => new Date(e.timestamp).getTime() <= cutoff))

  $effect(() => {
    onFilter(filtered)
  })

  function formatDate(ts) {
    return new Date(ts).toISOString().slice(0, 10)
  }

  function pctFromEvent(e) {
    if (!barEl) return
    const rect = barEl.getBoundingClientRect()
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left
    pct = Math.max(0, Math.min(1, x / rect.width))
  }

  function onMouseDown(e) {
    dragging = true
    pctFromEvent(e)
  }

  function onMouseMove(e) {
    if (dragging) pctFromEvent(e)
  }

  function onMouseUp() {
    dragging = false
  }

  function onTouchStart(e) {
    dragging = true
    pctFromEvent(e)
  }
</script>

<svelte:window
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  ontouchmove={onMouseMove}
  ontouchend={onMouseUp}
/>

<div class="fixed bottom-0 left-0 right-0 z-[200] bg-[#0a0a0a] border-t border-[#1a1a1a] px-4 py-2">
  <div class="flex items-center gap-3">
    <span class="text-[9px] text-[#555] tracking-widest shrink-0 w-20">
      {formatDate(startTime)}
    </span>

    <!-- Scrubber track -->
    <div
      bind:this={barEl}
      class="relative flex-1 h-6 cursor-pointer flex items-center"
      onmousedown={onMouseDown}
      ontouchstart={onTouchStart}
      role="slider"
      tabindex="0"
      aria-valuenow={Math.round(pct * 100)}
      aria-valuemin="0"
      aria-valuemax="100"
      onkeydown={(e) => {
        if (e.key === 'ArrowLeft') pct = Math.max(0, pct - 0.05)
        if (e.key === 'ArrowRight') pct = Math.min(1, pct + 0.05)
      }}
    >
      <!-- Track -->
      <div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#1a1a1a]"></div>

      <!-- Active fill -->
      <div
        class="absolute left-0 top-1/2 -translate-y-1/2 h-px bg-toxorange"
        style="width:{pct * 100}%"
      ></div>

      <!-- Event tick marks -->
      {#each allEvents as ev}
        {@const p = (new Date(ev.timestamp).getTime() - startTime) / (endTime - startTime)}
        {@const active = new Date(ev.timestamp).getTime() <= cutoff}
        <div
          class="absolute top-1/2 -translate-y-1/2 w-px h-2"
          style="left:{p * 100}%;background:{active ? '#ff6b00' : '#222'}"
        ></div>
      {/each}

      <!-- Handle -->
      <div
        class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-toxorange border border-toxorange/50 -translate-x-1/2"
        style="left:{pct * 100}%"
      ></div>
    </div>

    <span class="text-[9px] text-[#555] tracking-widest shrink-0 w-20 text-right">
      {formatDate(cutoff)}
    </span>

    <div class="text-[9px] text-[#333] shrink-0 w-16 text-right">
      {filtered.length}/{allEvents.length}
    </div>
  </div>
</div>
