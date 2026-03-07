# ui/header/

The always-visible top bar. Displays live aggregate stats derived from the current filtered events. Never hidden. Never collapsed. Always on top.

## What to build

### File: `Header.svelte`

Receives `events` (the currently filtered array). All displayed stats are `$derived` — they update automatically when the events array changes (e.g., timeline scrub).

---

## The exact output

```
TOXMAP    [EVENTS: 44]  [CASUALTIES: 1,247]  [CO₂e: 847 TONNES]  [≈ 3,388 FLIGHTS]  [PEOPLE IN PLUMES: 4.2M]  [● LIVE]
```

---

## Implementation

```svelte
<script>
  import { getTotalCO2e, formatEquivalency } from '../../data-pipeline/co2-calc/co2Calc.js'

  let { events = [] } = $props()

  // All stats are $derived — update automatically when events changes
  let totalEvents     = $derived(events.length)
  let totalCasualties = $derived(
    events.reduce((s, e) => s + parseInt(e.casualties || 0), 0)
  )
  let co2Totals       = $derived(getTotalCO2e(events))
  let equivalency     = $derived(formatEquivalency(co2Totals.kg))
  let peopleInPlumes  = $derived(computePeopleInPlumes(events))

  function computePeopleInPlumes(events) {
    const seen = new Set()
    let total = 0
    events.forEach(e => {
      (e.citiesInPlume ?? []).forEach(city => {
        if (!seen.has(city.name)) {
          seen.add(city.name)
          total += city.population
        }
      })
    })
    return total
  }

  function fmt(n) { return n.toLocaleString() }

  function fmtM(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
    return n.toLocaleString()
  }
</script>

<header class="fixed top-0 left-0 right-0 h-12 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center px-4 gap-6 z-[1000] font-mono text-xs text-[#888] whitespace-nowrap overflow-x-auto">

  <span class="text-[#ff2d2d] font-bold text-base tracking-[4px]" style="font-family: Orbitron, monospace">
    TOXMAP
  </span>

  <span class="text-[#555] uppercase tracking-wide">
    EVENTS: <span class="text-[#ccc]">{fmt(totalEvents)}</span>
  </span>

  <span class="text-[#555] uppercase tracking-wide">
    CASUALTIES: <span class="text-[#ccc]">{fmt(totalCasualties)}</span>
  </span>

  <span class="text-[#555] uppercase tracking-wide">
    CO₂e: <span class="text-[#ccc]">{fmt(co2Totals.tonnes)}</span> TONNES
  </span>

  <span class="text-[#555] uppercase tracking-wide">
    <span class="text-[#ccc]">{equivalency}</span>
  </span>

  <span class="text-[#555] uppercase tracking-wide">
    PEOPLE IN PLUMES: <span class="text-[#ccc]">{fmtM(peopleInPlumes)}</span>
  </span>

  <span class="ml-auto text-[#00ff88] animate-pulse">● LIVE</span>

</header>
```

---

## CO₂e disclaimer

The equivalency string from `formatEquivalency` already uses the `≈` symbol. But below it in the detail panel (not the header), always append: *"munitions only — real figure significantly higher"*

---

## Tailwind font configuration

To use Share Tech Mono and Orbitron via Tailwind v4, add to `src/assets/styles/app.css`:

```css
@import "tailwindcss";

@theme {
  --font-mono: 'Share Tech Mono', monospace;
  --font-orbitron: 'Orbitron', monospace;
}
```

Then use `font-mono` for body text and `font-[Orbitron]` or inline `style="font-family: Orbitron"` for the logo.

---

## What NOT to do

- Do not use `$effect` for the stats — `$derived` handles reactivity automatically
- Do not hardcode any numbers — always compute from `events` prop
- Do not add any buttons or interactivity — header is display-only

---

## Test it

- Header pinned to top, visible over the map
- All counters show correct values from mock events
- When parent changes `events` (e.g., pass a filtered subset), all counters update instantly
- "● LIVE" pulses green (Tailwind `animate-pulse`)
