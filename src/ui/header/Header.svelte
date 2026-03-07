<script>
  import { getTotalCO2e, formatEquivalency } from '../../data-pipeline/co2-calc/co2Calc.js'

  let { events = [] } = $props()

  function parseCasualties(str) {
    if (!str || str === '0') return 0
    const nums = str.match(/\d+/g)
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

  <div class="ml-auto flex items-center gap-2 shrink-0">
    <span class="w-2 h-2 rounded-full bg-toxred animate-pulse inline-block"></span>
    <span class="text-toxred text-xs font-orbitron tracking-widest">LIVE</span>
  </div>
</header>
