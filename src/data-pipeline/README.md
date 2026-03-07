# data-pipeline/

This directory owns everything that touches raw data — fetching it, cleaning it, and transforming it into structured objects the rest of the app consumes.

Nothing in this folder touches the DOM or the map. It is pure data logic.

## Subfolders

| Folder | Responsibility |
|---|---|
| `feed/` | Fetch iranwarlive.com/feed.json, filter null coordinates, expose clean event array |
| `weapon-profiles/` | Map each event's `type` string to its weapon profile (chemicals, CO₂e range, impact radius) |
| `co2-calc/` | Calculate CO₂e midpoint per event, running totals, human equivalency strings |

## Data contract — what leaves this folder

Every other module in the app depends on a single `events` array. Each object in that array looks like this:

```javascript
{
  event_id: "IRW-20260307-3205",
  type: "Drone strike",
  timestamp: "2026-03-07T09:00:28.346Z",
  event_summary: "Drone strike reported...",
  confidence: "News Wire",
  source_url: "https://...",
  casualties: "0",
  lat: 25.07736643,
  lng: 55.19397289,
  // Added by weapon-profiles:
  profile: {
    weapon: "Shahed-136/Israeli drone",
    chemicals: ["CO", "VOCs", "PM10", "NOx"],
    co2e_min: 80,
    co2e_max: 200,
    impact_radius_km: [0.5, 1]
  },
  // Added by co2-calc:
  co2e_estimate: 140  // midpoint in kg
}
```

## Build order

Build `feed/` first. Then `weapon-profiles/`. Then `co2-calc/`. Each depends on the previous.

## Integration point

`map-core/` and `ui/` both import the final enriched events array. Do not let map or UI code reach into raw fetch responses — all transformation happens here.
