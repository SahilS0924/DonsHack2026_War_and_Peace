<script>
  import { getTotalCO2e, formatEquivalency } from '../../data-pipeline/co2-calc/co2Calc.js'

  let { events = [], lastStrikesFetch = null, lastFiresFetch = null, lastAqiFetch = null } = $props()

  let tick = $state(0)
  $effect(() => { const id = setInterval(() => tick++, 30000); return () => clearInterval(id) })

  function minsAgo(ts) {
    if (!ts) return '—'
    return Math.floor((Date.now() - ts) / 60000) + 'm'
  }

  let strikesAge = $derived(tick >= 0 ? minsAgo(lastStrikesFetch) : '—')
  let firesAge = $derived(tick >= 0 ? minsAgo(lastFiresFetch) : '—')
  let aqiAge = $derived(tick >= 0 ? minsAgo(lastAqiFetch) : '—')

  function parseCasualties(str) {
    if (!str || str === '0' || str === 0) return 0
    const nums = String(str).match(/\d+/g)
    return nums ? nums.reduce((s, n) => s + parseInt(n), 0) : 0
  }

  let totalCasualties = $derived(events.reduce((s, e) => s + parseCasualties(e.casualties), 0))
  let co2 = $derived(getTotalCO2e(events))
  let equivalency = $derived(formatEquivalency(co2.kg))

  function computePeopleInPlumes(evts) {
    const seen = new Set()
    let total = 0
    for (const e of evts) {
      for (const city of (e.citiesInPlume ?? [])) {
        if (!seen.has(city.name)) {
          seen.add(city.name)
          total += city.population
        }
      }
    }
    return total
  }

  let peopleInPlumes = $derived(computePeopleInPlumes(events))
</script>

<header class="fixed top-0 left-0 right-0 z-[1000] bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-2 flex items-center gap-6 overflow-hidden">
  <span class="font-orbitron text-[#ccc] text-sm tracking-[0.2em] font-bold shrink-0">TOXMAP</span>

  <div class="flex items-center gap-1 text-xs shrink-0">
    <span class="text-[#555]">[</span>
    <span class="font-orbitron text-toxorange">{events.length}</span>
    <span class="text-[#555]">EVENTS]</span>
  </div>

  <div class="flex items-center gap-1 text-xs shrink-0">
    <span class="text-[#555]">[</span>
    <span class="font-orbitron text-toxred">{totalCasualties.toLocaleString()}</span>
    <span class="text-[#555]">KIA+WIA]</span>
  </div>

  <div class="flex items-center gap-1 text-xs shrink-0">
    <span class="text-[#555]">[</span>
    <span class="font-orbitron text-toxorange">{co2.tonnes.toLocaleString()}T</span>
    <span class="text-[#555]">CO\u2082e]</span>
  </div>

  <div class="text-[#555] text-xs shrink-0 hidden md:block">{equivalency}</div>

  {#if peopleInPlumes > 0}
    <div class="flex items-center gap-1 text-xs shrink-0">
      <span class="text-[#555]">[</span>
      <span class="font-orbitron text-[#ff6b00]">{(peopleInPlumes / 1_000_000).toFixed(1)}M</span>
      <span class="text-[#555]">IN PLUMES]</span>
    </div>
  {/if}

  <div class="ml-auto flex items-center gap-4 shrink-0">
    <div class="text-[9px] text-[#333] tracking-wide hidden lg:flex gap-3">
      <span>STRIKES <span class="text-[#555]">{strikesAge}</span></span>
      <span>FIRES <span class="text-[#555]">{firesAge}</span></span>
      <span>AQI <span class="text-[#555]">{aqiAge}</span></span>
    </div>
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-full bg-toxred animate-pulse inline-block"></span>
      <span class="text-toxred text-xs font-orbitron tracking-widest">LIVE</span>
    </div>
  </div>
</header>
