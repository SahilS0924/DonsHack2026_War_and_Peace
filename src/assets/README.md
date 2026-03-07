# assets/

Static assets for ToxMap. One subfolder: `styles/`.

## Subfolders

| Folder | File | Responsibility |
|---|---|---|
| `styles/` | `app.css` | Tailwind v4 import + custom CSS animations (scanline, pulse, flicker) + Tailwind theme config |

## How CSS works in this project

**Tailwind CSS v4** handles all layout, spacing, colors, and typography via utility classes in the Svelte components. The `app.css` file contains:
1. `@import "tailwindcss"` — loads the entire Tailwind system
2. `@theme { ... }` — configures custom fonts (Share Tech Mono, Orbitron)
3. Custom `@keyframes` for scanline, pulse, and flicker — these can't be done with utilities
4. MapLibre popup overrides (the popup HTML is injected by MapLibre, not by our Svelte templates)

Do not write component-level CSS in separate files. All CSS goes in `app.css` or inline in Svelte components as Tailwind classes.
