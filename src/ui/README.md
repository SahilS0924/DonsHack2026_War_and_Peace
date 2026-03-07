# ui/

All UI panels as Svelte 5 components. These receive data as props from `App.svelte` and emit user events via callback props. No fetching, no direct map manipulation (except sidebar's click-to-fly).

## Subfolders

| Folder | File | Responsibility |
|---|---|---|
| `header/` | `Header.svelte` | Always-visible top bar — live counters derived from events |
| `sidebar/` | `Sidebar.svelte` | Left panel — event list, filters, click-to-fly |
| `detail-panel/` | `DetailPanel.svelte` | Right panel — slides in with full env cost breakdown |
| `timeline/` | `Timeline.svelte` | Bottom scrubber — drag to filter events by date |

## Svelte 5 reactivity pattern

All components use Svelte 5 runes. Data flows down as props, events bubble up as callbacks:

```svelte
<!-- Parent (App.svelte) -->
<Header events={filteredEvents} />
<Sidebar events={filteredEvents} {map} onEventClick={(e) => selectedEvent = e} />
<DetailPanel event={selectedEvent} onClose={() => selectedEvent = null} />
<Timeline allEvents={allEvents} onFilter={(f) => filteredEvents = f} />
```

Components that display aggregate stats use `$derived`:

```svelte
<script>
  let { events } = $props()
  let totalEvents     = $derived(events.length)
  let totalCasualties = $derived(events.reduce((s, e) => s + parseInt(e.casualties || 0), 0))
  let totalCO2eTonnes = $derived(Math.round(events.reduce((s, e) => s + (e.co2e_estimate ?? 0), 0) / 1000))
</script>
```

No `$effect` needed for derived values — Svelte computes them automatically.

## Design rules — no exceptions

- Font: `font-[Share_Tech_Mono]` for body, `font-[Orbitron]` for numbers/headers (configure in Tailwind CSS v4)
- Background: `bg-[#0a0a0a]` everywhere
- No rounded corners: `rounded-none` or avoid `rounded` classes entirely
- No shadows except `shadow-none`
- Colors from the palette only (see `assets/styles/`)
- Uppercase text for labels and badges

## z-index stack

```
z-[9999]  → scanline overlay (pointer-events-none)
z-[1000]  → Header
z-[500]   → DetailPanel
z-[400]   → Sidebar
z-[200]   → Timeline
z-[1]     → Map canvas
```

Use Tailwind's arbitrary z-index: `class="z-[400]"`

## Layout positioning

All panels use `fixed` positioning with Tailwind:

- Header: `fixed top-0 left-0 right-0 h-12`
- Sidebar: `fixed top-12 left-0 w-[280px] bottom-14`
- Detail panel: `fixed top-12 right-0 w-[320px] bottom-14` (translate off-screen when closed)
- Timeline: `fixed bottom-0 left-[280px] right-0 h-14`
- Map: `fixed inset-0`
