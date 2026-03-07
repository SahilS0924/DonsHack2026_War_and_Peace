# assets/styles/

All global CSS for ToxMap. One file: `app.css`. Imported once in `src/main.js`.

## What to build

### File: `app.css`

Build in sections:

---

## Section 1 — Tailwind v4 import + theme

```css
@import "tailwindcss";

@theme {
  /* Custom fonts — configure once here, use font-mono / font-orbitron as Tailwind classes */
  --font-mono: 'Share Tech Mono', monospace;
  --font-orbitron: 'Orbitron', monospace;

  /* Custom colors usable as bg-toxred, text-toxorange, etc. */
  --color-toxred:    #ff2d2d;
  --color-toxorange: #ff6b00;
  --color-toxyellow: #ffd700;
  --color-toxgreen:  #00ff88;
  --color-toxbg:     #0a0a0a;
  --color-toxborder: #1a1a1a;
}
```

With Tailwind v4's `@theme`, these become available as utility classes:
- `text-toxred`, `bg-toxred`, `border-toxred`
- `text-toxorange`, `bg-toxorange`
- `bg-toxbg`, `border-toxborder`
- `font-mono` → Share Tech Mono
- `font-orbitron` → Orbitron

---

## Section 2 — Base reset

Tailwind's `@import "tailwindcss"` includes Preflight (a modern CSS reset). Add overrides:

```css
html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0a0a;
}

/* Remove MapLibre's default logo (optional) */
.maplibregl-ctrl-logo { display: none !important; }
.maplibregl-ctrl-attrib { display: none !important; }
```

---

## Section 3 — Scanline CRT overlay

Applied via a div with class `scanline-overlay` in App.svelte (not `body::after`, because Svelte manages the body). The div is `pointer-events-none` and `z-[9999]`:

```css
.scanline-overlay {
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 9999;
}
```

In App.svelte:
```svelte
<div class="scanline-overlay" aria-hidden="true"></div>
```

---

## Section 4 — Strike marker pulse animations

These animate the HTML marker elements created by `StrikeMarkers.svelte`:

```css
@keyframes pulse {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(1.6); opacity: 0.6; }
  100% { transform: scale(1);   opacity: 1; }
}

.strike-marker  { animation: pulse 2.0s ease-in-out infinite; }
.missile-marker { animation: pulse 2.5s ease-in-out infinite; }
.drone-marker   { animation: pulse 3.0s ease-in-out infinite; }
```

---

## Section 5 — MapLibre popup overrides

MapLibre injects popup HTML directly into the DOM — we can't control it with Svelte classes, so we override it here with global CSS:

```css
.aqi-popup .maplibregl-popup-content {
  background: #0a0a0a !important;
  border: 1px solid #333 !important;
  color: #ccc !important;
  font-family: 'Share Tech Mono', monospace !important;
  font-size: 11px !important;
  padding: 6px 10px !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.aqi-popup .maplibregl-popup-tip {
  border-top-color: #333 !important;
}
```

---

## Section 6 — Scrollbar styling

```css
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #0a0a0a; }
::-webkit-scrollbar-thumb { background: #1a1a1a; }
::-webkit-scrollbar-thumb:hover { background: #333; }
```

---

## Design rules — enforce everywhere

| Rule | Implementation |
|---|---|
| Background | `bg-[#0a0a0a]` or `bg-toxbg` |
| Primary text | `text-[#ccc]` |
| Muted text | `text-[#555]` or `text-[#888]` |
| Airstrikes | `text-toxred` / `bg-toxred` / `#ff2d2d` |
| Missiles | `text-toxorange` / `#ff6b00` |
| Drones | `text-[#ffd700]` / `#ffd700` |
| Interceptions | `text-toxgreen` / `#00ff88` |
| Border radius | `rounded-none` — never use `rounded`, `rounded-md`, etc. |
| Shadows | `shadow-none` only |
| Borders | `border-toxborder` / `border-[#1a1a1a]` |

If you are adding a UI element with white background, gradient, rounded corners, or drop shadow: stop. It is wrong. Match the aesthetic.

---

## What NOT to do

- Do not add component-scoped `<style>` blocks in Svelte files — use Tailwind classes instead
- Do not use `border-radius` / `rounded-*` on any element
- Do not use `box-shadow` except on MapLibre popups (which we're overriding away)
- Do not add CSS for MapLibre's default UI (zoom buttons, attribution) — hide it in Section 2
- Do not scatter custom CSS across multiple files — everything global goes here
