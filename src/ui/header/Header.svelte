<script>
  import { getTotalCO2e, formatEquivalency } from '../../data-pipeline/co2-calc/co2Calc.js'

  let { events = [] } = $props()

  let totalEvents = $derived(events.length)
  let totalCasualties = $derived(
    events.reduce((s, e) => s + parseInt(e.casualties || 0, 10), 0)
  )
  let co2Totals = $derived(getTotalCO2e(events))
  let equivalency = $derived(formatEquivalency(co2Totals.kg))
  let peopleInPlumes = $derived(computePeopleInPlumes(events))

  function computePeopleInPlumes(evts) {
    const seen = new Set()
    let total = 0
    evts.forEach((e) => {
      ;(e.citiesInPlume ?? []).forEach((city) => {
        if (!seen.has(city.name)) {
          seen.add(city.name)
          total += city.population
        }
      })
    })
    return total
  }

  function fmt(n) {
    return n.toLocaleString()
  }

  function fmtM(n) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
    return n.toLocaleString()
  }
</script>

<header
  class="fixed top-0 left-0 right-0 h-12 bg-[#0a0a0a] border-b border-[#1a1a1a] flex items-center px-4 gap-6 z-[1000] font-mono text-xs text-[#888] whitespace-nowrap overflow-x-auto"
>
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
