<script>
  let { event = null, onClose } = $props()

  function getColor(type) {
    if (!type) return '#ccc'
    const t = type.toLowerCase()
    if (t.includes('drone')) return '#ffd700'
    if (t.includes('intercept') || t.includes('defensive')) return '#00ff88'
    if (t.includes('missile') || t.includes('ballistic') || t.includes('projectile')) return '#ff6b00'
    return '#ff2d2d'
  }

  function formatTime(ts) {
    return new Date(ts).toUTCString()
  }

  function inferActor(summary = '') {
    const s = summary.toLowerCase()
    if (s.includes('idf') || s.includes('israeli') || s.includes('israel')) return 'Israel (IDF)'
    if (s.includes('irgc') || (s.includes('iran') && !s.includes('iranian-backed'))) return 'Iran (IRGC)'
    if (s.includes('centcom') || s.includes('u.s.') || s.includes('american') || s.includes('pentagon')) return 'United States'
    if (s.includes('hezbollah')) return 'Hezbollah'
    if (s.includes('houthi') || s.includes('ansar allah')) return 'Houthi / Ansar Allah'
    if (s.includes('hamas')) return 'Hamas'
    return null
  }

  let color = $derived(getColor(event?.type))
  let visible = $derived(event !== null)
</script>

<aside class="fixed top-[41px] right-0 bottom-[60px] z-[500] w-[320px] bg-[#0a0a0a] border-l border-[#1a1a1a] flex flex-col transition-transform duration-300 {visible ? 'translate-x-0' : 'translate-x-full'}">
  {#if event}
    <!-- Header bar -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-[#1a1a1a] shrink-0">
      <span class="text-[10px] tracking-widest text-[#555]">ENV IMPACT ANALYSIS</span>
      <button class="text-[#555] hover:text-[#ccc] text-lg leading-none" onclick={onClose}>✕</button>
    </div>

    <div class="overflow-y-auto flex-1 px-3 py-3 space-y-4">
      {#snippet row(label, value, valueColor)}
        <div class="flex justify-between gap-2 text-[10px]">
          <span class="text-[#555] shrink-0">{label}</span>
          <span class="text-right" style="color:{valueColor ?? '#ccc'}">{value}</span>
        </div>
      {/snippet}

      <!-- Type badge -->
      <div>
        <span class="text-[10px] px-2 py-0.5 border" style="color:{color};border-color:{color}44;background:{color}11;">{event.type}</span>
      </div>

      <!-- Summary -->
      <div class="text-[11px] text-[#888] leading-relaxed">{event.event_summary}</div>

      <!-- Metadata rows -->
      <div class="space-y-1.5">
        {@render row('TIME', formatTime(event.timestamp))}
        {@render row('CONFIDENCE', event.confidence)}
        {@render row('CASUALTIES', event.casualties !== '0' ? event.casualties : 'None reported')}
        {@render row('WEAPON', event.profile?.weapon ?? 'Unknown')}
        {@render row('IMPACT RADIUS', event.profile ? `${event.profile.impact_radius_min}–${event.profile.impact_radius_max} km` : 'N/A')}
      </div>

      {#if inferActor(event.event_summary)}
        <div class="space-y-1.5">
          {@render row('ACTOR', inferActor(event.event_summary))}
        </div>
      {/if}

      <!-- Chemicals -->
      {#if event.profile?.chemicals?.length}
        <div>
          <div class="text-[9px] text-[#555] mb-1.5 tracking-widest">TOXIC EMISSIONS</div>
          <div class="flex flex-wrap gap-1">
            {#each event.profile.chemicals as chem}
              <span class="text-[9px] px-1.5 py-0.5 border border-toxorange/30 text-toxorange bg-toxorange/5">{chem}</span>
            {/each}
          </div>
        </div>
      {/if}

      <!-- CO2e -->
      {#if event.co2e_estimate}
        <div class="border border-[#1a1a1a] p-2">
          <div class="text-[9px] text-[#555] tracking-widest mb-1">CO\u2082 EQUIVALENT</div>
          <div class="font-orbitron text-toxorange text-lg">{event.co2e_estimate.toLocaleString()} <span class="text-sm">kg</span></div>
          <div class="text-[9px] text-[#555] mt-0.5">munitions only — real figure significantly higher</div>
        </div>
      {/if}

      <!-- Wind / plume data -->
      {#if event.wind}
        <div class="space-y-1.5">
          <div class="text-[9px] text-[#555] tracking-widest">DISPERSION (OPEN-METEO)</div>
          {@render row('WIND SPEED', `${event.wind.windSpeed?.toFixed(1) ?? '—'} km/h`)}
          {@render row('DIRECTION', `${event.wind.windDirection ?? '—'}\u00b0`)}
          {@render row('PLUME LENGTH', `${event.plumeLength?.toFixed(1) ?? '—'} km`)}
        </div>
      {/if}

      <!-- Cities in plume -->
      {#if event.citiesInPlume?.length}
        <div>
          <div class="text-[9px] text-[#555] tracking-widest mb-1.5">CITIES IN PLUME PATH</div>
          {#each event.citiesInPlume as city}
            <div class="flex justify-between text-[10px] py-0.5 border-b border-[#111]">
              <span class="text-[#ccc]">{city.name}</span>
              <span class="text-[#555]">{(city.population / 1_000_000).toFixed(1)}M</span>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Source -->
      {#if event.source_url}
        <div class="text-[9px] text-[#333] break-all">SRC: {event.source_url}</div>
      {/if}

      <!-- Disclaimer -->
      <div class="text-[9px] text-[#333] leading-relaxed border-t border-[#111] pt-3">
        CO\u2082e figures are estimates based on published munitions propellant chemistry (Brown University Costs of War Project; CEOBS). Plume geometry uses real historical wind data from Open-Meteo. Strike data from iranwarlive.com OSINT feed. All estimates labelled as such.
      </div>
    </div>
  {/if}
</aside>
