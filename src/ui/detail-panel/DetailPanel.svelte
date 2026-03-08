<script>
  let { event = null, onClose } = $props()

  function degreesToCardinal(deg) {
    if (deg == null) return '–'
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    return dirs[Math.round(deg / 45) % 8]
  }

  function formatTimestamp(iso) {
    const d = new Date(iso)
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
    return `${months[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, '0')} · ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')} UTC`
  }

  function inferActor(summary) {
    const s = (summary || '').toLowerCase()
    if (s.includes('us/israeli') || s.includes('us-israeli')) return 'US / Israeli Forces'
    if (s.includes('israeli air force') || s.includes('idf')) return 'Israeli Air Force (IDF)'
    if (s.includes('us ') || s.includes('centcom') || s.includes('b-2')) return 'US Forces (CENTCOM)'
    if (s.includes('iranian') || s.includes('irgc')) return 'Iranian IRGC'
    if (s.includes('hezbollah')) return 'Hezbollah'
    if (s.includes('houthi')) return 'Houthi Forces'
    return 'Unknown Actor'
  }

  function parseLocation(summary) {
    const patterns = [
      /(?:strikes?|targeting|struck|hit|attack(?:ed|s)?)\s+(.+?)(?:\.|,|$)/i,
      /(?:in|near|at|over)\s+(.+?)(?:\.|,|$)/i,
    ]
    for (const p of patterns) {
      const m = (summary || '').match(p)
      if (m) return m[1].trim().slice(0, 50)
    }
    return (summary || '').slice(0, 50)
  }

  let isOpen = $derived(event !== null)
  let profile = $derived(event?.profile)
  let wind = $derived(event?.wind ?? { windSpeed: null, windDirection: null })
  let co2eTonnes = $derived(event ? (event.co2e_estimate / 1000).toFixed(1) : '–')
  let plumeKm = $derived(event?.plumeLength ?? '–')
  let cardinal = $derived(degreesToCardinal(wind?.windDirection))
  let citiesInPlume = $derived(event?.citiesInPlume ?? [])
  let peopleInPlume = $derived(citiesInPlume.reduce((s, c) => s + (c.population ?? 0), 0))
  let actor = $derived(event ? inferActor(event.event_summary) : '')
  let location = $derived(event ? parseLocation(event.event_summary) : '')
  let timestamp = $derived(event ? formatTimestamp(event.timestamp) : '')
</script>

<aside
  class="fixed top-12 right-0 w-[320px] bottom-14 bg-[#0a0a0a]/95 border-l border-[#1a1a1a] z-[500] overflow-y-auto font-mono text-[11px] text-[#888] transition-transform duration-300 {isOpen
    ? 'translate-x-0'
    : 'translate-x-full'}"
>
  {#if event && profile}
    <button
      class="absolute top-3 right-3 text-[#444] hover:text-[#888] text-sm cursor-pointer bg-transparent border-none"
      onclick={onClose}
    >✕</button>

    <div class="p-4 pr-8">
      <div class="text-[#ff2d2d] text-[13px] mb-1" style="font-family: Orbitron, monospace">
        ▸ {event.type?.toUpperCase() ?? 'EVENT'}
      </div>
      <div class="text-[#ddd] text-[13px] mb-0.5">{location}</div>
      <div class="text-[#444] text-[10px] mb-3">{timestamp} UTC</div>

      <div class="border-t border-[#1a1a1a] mb-3"></div>

      {#snippet row(label, value)}
        <div class="flex justify-between mb-1.5 gap-2">
          <span class="text-[#444] shrink-0">{label}</span>
          <span class="text-[#ccc] text-right">{value}</span>
        </div>
      {/snippet}

      {@render row('Actor', actor)}
      {@render row('Source', event.confidence ?? '–')}
      {@render row('Casualties', event.casualties ?? '0')}

      {#if event.source_url}
        <a
          href={event.source_url}
          target="_blank"
          rel="noopener"
          class="block text-[#444] hover:text-[#888] text-[10px] tracking-wider no-underline mb-3"
        >
          VIEW SOURCE →
        </a>
      {/if}

      <div class="text-[#ff6b00] text-[10px] tracking-[2px] uppercase mt-3 mb-2">◈ ENVIRONMENTAL COST</div>

      {@render row('Weapon', profile?.weapon ?? '–')}

      <div class="flex justify-between mb-1.5 gap-2">
        <span class="text-[#444] shrink-0">Chemicals</span>
        <span class="text-[#ff6b00] text-[10px] text-right"
          >{profile?.chemicals?.join(', ') ?? '–'}</span
        >
      </div>

      {@render row('CO₂e estimate', `~${co2eTonnes} tonnes`)}
      {@render row('Impact radius', profile ? `${profile.impact_radius_min}–${profile.impact_radius_max} km` : '–')}
      {@render row('People in plume', peopleInPlume.toLocaleString())}

      {#if citiesInPlume.length > 0}
        <div class="text-[#555] text-[10px] mb-2 pl-2">
          ↳ {citiesInPlume.map((c) => c.name).join(', ')}
        </div>
      {/if}

      <div class="text-[#ff6b00] text-[10px] tracking-[2px] uppercase mt-3 mb-2">WIND AT STRIKE TIME</div>

      {@render row('Speed', wind?.windSpeed != null ? `${wind.windSpeed} km/h` : '–')}
      {@render row('Direction', wind?.windDirection != null ? `${wind.windDirection}° (${cardinal})` : '–')}
      {@render row('Plume length', `${plumeKm} km ${cardinal}`)}

      <div class="mt-4 pt-3 border-t border-[#111] text-[#2a2a2a] text-[9px] leading-relaxed">
        * Estimates only. Munitions emissions only.<br />
        Real environmental cost significantly higher.<br /><br />
        CO₂e: Brown University Costs of War / CEOBS.<br />
        Wind: Open-Meteo historical archive.<br />
        Population: UN World Urbanization Prospects 2024.
      </div>
    </div>
  {/if}
</aside>
