<script>
  let { allEvents = [], onFilter } = $props()

  const START_DATE = new Date('2026-02-28T00:00:00Z')
  const END_DATE = new Date()

  let pct = $state(1)
  let trackEl = $state(null)
  let isDragging = $state(false)

  let dayLabels = $derived(
    (() => {
      const labels = []
      let d = new Date(START_DATE)
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
      while (d <= END_DATE) {
        const p = ((d - START_DATE) / (END_DATE - START_DATE)) * 100
        labels.push({ label: `${months[d.getUTCMonth()]} ${d.getUTCDate()}`, pct: p })
        d = new Date(d.getTime() + 24 * 60 * 60 * 1000)
      }
      return labels
    })()
  )

  $effect(() => {
    const cutoff = new Date(START_DATE.getTime() + pct * (END_DATE - START_DATE))
    onFilter?.(allEvents.filter((e) => new Date(e.timestamp) <= cutoff))
  })

  function updateFromClientX(clientX) {
    if (!trackEl) return
    const rect = trackEl.getBoundingClientRect()
    pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  function onMouseDown(e) {
    isDragging = true
    updateFromClientX(e.clientX)
  }

  function onMouseMove(e) {
    if (!isDragging) return
    updateFromClientX(e.clientX)
  }

  function onMouseUp() {
    isDragging = false
  }

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

<svelte:window
  onmousemove={onMouseMove}
  onmouseup={onMouseUp}
  ontouchmove={onTouchMove}
  ontouchend={onMouseUp}
/>

<div
  class="fixed bottom-0 left-[280px] right-0 h-14 bg-[#0a0a0a]/90 border-t border-[#1a1a1a] z-[200] flex flex-col justify-center px-6 font-mono"
>
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
    <div class="absolute top-0 left-0 h-full bg-[#ff2d2d]" style="width: {pct * 100}%"></div>

    <div
      class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#ff2d2d] border-2 border-[#0a0a0a] cursor-grab active:cursor-grabbing"
      style="left: {pct * 100}%"
    ></div>
  </div>
</div>
