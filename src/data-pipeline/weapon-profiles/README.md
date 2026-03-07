# data-pipeline/weapon-profiles/

Maps every event `type` string from the feed to its environmental profile: what weapon was likely used, what toxic chemicals it releases, its CO₂e range (kg), and its impact radius (km).

## What to build

### File: `weaponProfiles.js`

Export:
1. `WEAPON_PROFILES` — the lookup table (keyed by event type string)
2. `getProfile(eventType)` — returns the matching profile, falls back to a default

---

## Implementation

### The full lookup table

```javascript
export const WEAPON_PROFILES = {
  'Ballistic Missile Strike': {
    weapon: 'Iranian Shahab/Fattah',
    chemicals: ['UDMH', 'NO₂', 'HCN', 'NOx'],
    co2e_min: 2000,
    co2e_max: 8000,
    impact_radius_min: 5,
    impact_radius_max: 15,
  },
  'Missile attack (intercepted)': {
    weapon: 'THAAD/Patriot PAC-3',
    chemicals: ['HCl', 'Al₂O₃', 'NOx'],
    co2e_min: 300,
    co2e_max: 600,
    impact_radius_min: 0.5,
    impact_radius_max: 1,
  },
  'Missile Strike': {
    weapon: 'Tomahawk/PrSM',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5'],
    co2e_min: 500,
    co2e_max: 2000,
    impact_radius_min: 3,
    impact_radius_max: 8,
  },
  'Missile/Projectile attack': {
    weapon: 'Mixed ballistic',
    chemicals: ['NOx', 'UDMH traces', 'PM2.5'],
    co2e_min: 1000,
    co2e_max: 5000,
    impact_radius_min: 3,
    impact_radius_max: 10,
  },
  'Air Strike': {
    weapon: 'GBU-31 JDAM / F-35',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5', 'CO'],
    co2e_min: 500,
    co2e_max: 3000,
    impact_radius_min: 2,
    impact_radius_max: 5,
  },
  'Airstrike': {
    weapon: 'GBU-31 JDAM / F-35',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5', 'CO'],
    co2e_min: 500,
    co2e_max: 3000,
    impact_radius_min: 2,
    impact_radius_max: 5,
  },
  'Airstrikes/Bombardment': {
    weapon: 'Sustained air campaign',
    chemicals: ['NOx', 'SO₂', 'PM2.5', 'CO'],
    co2e_min: 5000,
    co2e_max: 20000,
    impact_radius_min: 5,
    impact_radius_max: 15,
  },
  'Airstrikes/Bombing (Cumulative Impact)': {
    weapon: 'Multiple munitions',
    chemicals: ['NOx', 'SO₂', 'Black Carbon'],
    co2e_min: 10000,
    co2e_max: 50000,
    impact_radius_min: 10,
    impact_radius_max: 20,
  },
  'Drone strike': {
    weapon: 'Shahed-136/Israeli drone',
    chemicals: ['CO', 'VOCs', 'PM10', 'NOx'],
    co2e_min: 80,
    co2e_max: 200,
    impact_radius_min: 0.5,
    impact_radius_max: 1,
  },
  'Drone Attack': {
    weapon: 'Shahed-136/Israeli drone',
    chemicals: ['CO', 'VOCs', 'PM10', 'NOx'],
    co2e_min: 80,
    co2e_max: 200,
    impact_radius_min: 0.5,
    impact_radius_max: 1,
  },
  'Naval Strike': {
    weapon: 'Ship-launched missile',
    chemicals: ['HFO', 'SO₂', 'Benzene', 'PAHs'],
    co2e_min: 2000,
    co2e_max: 15000,
    impact_radius_min: 3,
    impact_radius_max: 10,
  },
  'Ground Incursion': {
    weapon: 'Armoured vehicles',
    chemicals: ['Diesel PM', 'Lead', 'NOx'],
    co2e_min: 50,
    co2e_max: 150,
    impact_radius_min: 1,
    impact_radius_max: 2,
  },
  'Interception': {
    weapon: 'Iron Dome/David\'s Sling',
    chemicals: ['HCl', 'Al₂O₃', 'NOx'],
    co2e_min: 100,
    co2e_max: 300,
    impact_radius_min: 0.5,
    impact_radius_max: 0.5,
  },
  'Defensive Fire': {
    weapon: 'Iron Dome/David\'s Sling',
    chemicals: ['HCl', 'Al₂O₃', 'NOx'],
    co2e_min: 100,
    co2e_max: 300,
    impact_radius_min: 0.5,
    impact_radius_max: 0.5,
  },
}

const DEFAULT_PROFILE = {
  weapon: 'Unknown munition',
  chemicals: ['NOx', 'PM2.5'],
  co2e_min: 200,
  co2e_max: 1000,
  impact_radius_min: 1,
  impact_radius_max: 3,
}

export function getProfile(eventType) {
  return WEAPON_PROFILES[eventType] ?? DEFAULT_PROFILE
}
```

---

## Usage

```javascript
import { getProfile } from './weapon-profiles/weaponProfiles.js'

const profile = getProfile(event.type)
// profile.chemicals → ['UDMH', 'NO₂', 'HCN', 'NOx']
// profile.co2e_min → 2000
// profile.co2e_max → 8000
// profile.impact_radius_min → 5
// profile.impact_radius_max → 15
```

---

## What NOT to do

- Do not calculate CO₂e here — that's `co2-calc/`
- Do not render chemicals to the DOM here — that's `ui/detail-panel/`
- Do not modify the event object here — the calling code adds `profile` to the event

---

## Test it

```javascript
console.log(getProfile('Drone strike'))
// → { weapon: 'Shahed-136/Israeli drone', chemicals: [...], co2e_min: 80, co2e_max: 200, ... }

console.log(getProfile('UNKNOWN TYPE'))
// → default profile, no crash
```
