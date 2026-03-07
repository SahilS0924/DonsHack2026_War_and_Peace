# data-pipeline/co2-calc/

Calculates CO₂e estimates per event and project-wide totals. Also formats human-readable equivalency strings for display in the header and detail panel.

## What to build

### File: `co2Calc.js`

Export three functions:
1. `calculateCO2e(profile)` — midpoint estimate for one event
2. `getTotalCO2e(events)` — sum across all events (in kg, then convert to tonnes)
3. `formatEquivalency(totalKg)` — returns a human equivalency string

---

## Implementation

### calculateCO2e

```javascript
export function calculateCO2e(profile) {
  // Returns midpoint in kg
  return Math.round((profile.co2e_min + profile.co2e_max) / 2)
}
```

### getTotalCO2e

```javascript
export function getTotalCO2e(events) {
  const totalKg = events.reduce((sum, e) => sum + (e.co2e_estimate ?? 0), 0)
  const totalTonnes = Math.round(totalKg / 1000)
  return { kg: totalKg, tonnes: totalTonnes }
}
```

### formatEquivalency

Pick ONE equivalency based on the magnitude of total tonnes. Return a short string.

```javascript
export function formatEquivalency(totalKg) {
  const tonnes = totalKg / 1000

  if (tonnes >= 1000) {
    const villages = Math.round(tonnes / 1000)
    return `≈ ${villages.toLocaleString()} small village annual emissions`
  }
  if (tonnes >= 100) {
    const kmDriven = Math.round((tonnes / 100) * 500000)
    return `≈ driving ${kmDriven.toLocaleString()} km by car`
  }
  if (tonnes >= 10) {
    const people = Math.round(tonnes / 10)
    return `≈ ${people} person-years of carbon footprint`
  }
  const flights = Math.round(tonnes * 4)
  return `≈ ${flights.toLocaleString()} London–New York return flights`
}
```

**Equivalency reference (from PRD):**
- 1 tonne = 4 return flights London–New York
- 10 tonnes = 1 person's annual carbon footprint
- 100 tonnes = driving a car 500,000 km
- 1,000 tonnes = annual emissions of a small village

---

## Usage — enriching the events array

Call this in the main data pipeline, after `getProfile()` attaches the profile:

```javascript
import { getProfile } from '../weapon-profiles/weaponProfiles.js'
import { calculateCO2e, getTotalCO2e, formatEquivalency } from '../co2-calc/co2Calc.js'

// Enrich each event
events.forEach(e => {
  e.profile = getProfile(e.type)
  e.co2e_estimate = calculateCO2e(e.profile)
})

// Get totals for header bar
const { kg, tonnes } = getTotalCO2e(events)
const equivalency = formatEquivalency(kg)
// → "≈ 3,388 London–New York return flights"
```

---

## Display label requirement

**Always** append this disclaimer wherever CO₂e numbers appear in the UI:

> *"munitions only — real figure significantly higher"*

This applies to both the header bar and the detail panel. It is not optional.

---

## What NOT to do

- Do not render anything — no DOM code in this file
- Do not use tonnes internally for calculation — keep kg throughout, convert only for display
- Do not round to more than 3 significant figures — these are estimates

---

## Test it

```javascript
import { calculateCO2e, getTotalCO2e, formatEquivalency } from './co2Calc.js'

const mockProfile = { co2e_min: 2000, co2e_max: 8000 }
console.log(calculateCO2e(mockProfile))  // → 5000 (kg)

const mockEvents = [
  { co2e_estimate: 5000 },
  { co2e_estimate: 140 },
  { co2e_estimate: 1250 },
]
const totals = getTotalCO2e(mockEvents)
console.log(totals.tonnes)  // → 6 tonnes
console.log(formatEquivalency(totals.kg))  // → "≈ 24 London–New York return flights"
```
