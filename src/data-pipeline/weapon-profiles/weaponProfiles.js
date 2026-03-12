const WEAPON_PROFILES = {
  'Ballistic Missile Strike': {
    weapon: 'Ballistic Missile',
    chemicals: ['UDMH', 'NO\u2082', 'HCN', 'NOx'],
    co2e_min: 2000, co2e_max: 8000,
    impact_radius_min: 5, impact_radius_max: 15,
  },
  'Missile attack (intercepted)': {
    weapon: 'Intercepted Missile',
    chemicals: ['HCl', 'Al\u2082O\u2083', 'NOx'],
    co2e_min: 300, co2e_max: 600,
    impact_radius_min: 0.5, impact_radius_max: 1,
  },
  'Missile Strike': {
    weapon: 'Cruise/Ballistic Missile',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5'],
    co2e_min: 500, co2e_max: 2000,
    impact_radius_min: 3, impact_radius_max: 8,
  },
  'Missile Attack': {
    weapon: 'Cruise/Ballistic Missile',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5'],
    co2e_min: 500, co2e_max: 2000,
    impact_radius_min: 3, impact_radius_max: 8,
  },
  'Missile/Projectile attack': {
    weapon: 'Missile/Projectile',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5'],
    co2e_min: 500, co2e_max: 2000,
    impact_radius_min: 3, impact_radius_max: 8,
  },
  'Air Strike': {
    weapon: 'Strike Aircraft',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5', 'CO'],
    co2e_min: 500, co2e_max: 3000,
    impact_radius_min: 2, impact_radius_max: 5,
  },
  'Airstrike': {
    weapon: 'Strike Aircraft',
    chemicals: ['NOx', 'Black Carbon', 'PM2.5', 'CO'],
    co2e_min: 500, co2e_max: 3000,
    impact_radius_min: 2, impact_radius_max: 5,
  },
  'Airstrikes/Bombardment': {
    weapon: 'Multi-Aircraft Bombardment',
    chemicals: ['NOx', 'SO\u2082', 'PM2.5', 'CO'],
    co2e_min: 5000, co2e_max: 20000,
    impact_radius_min: 5, impact_radius_max: 15,
  },
  'Airstrikes/Bombing (Cumulative Impact)': {
    weapon: 'Sustained Bombing Campaign',
    chemicals: ['NOx', 'SO\u2082', 'PM2.5', 'CO', 'Black Carbon'],
    co2e_min: 5000, co2e_max: 20000,
    impact_radius_min: 5, impact_radius_max: 15,
  },
  'Drone strike': {
    weapon: 'Combat Drone',
    chemicals: ['CO', 'VOCs', 'PM10', 'NOx'],
    co2e_min: 80, co2e_max: 200,
    impact_radius_min: 0.5, impact_radius_max: 1,
  },
  'Drone Strike': {
    weapon: 'Combat Drone',
    chemicals: ['CO', 'VOCs', 'PM10', 'NOx'],
    co2e_min: 80, co2e_max: 200,
    impact_radius_min: 0.5, impact_radius_max: 1,
  },
  'Drone Attack': {
    weapon: 'Attack Drone',
    chemicals: ['CO', 'VOCs', 'PM10', 'NOx'],
    co2e_min: 80, co2e_max: 200,
    impact_radius_min: 0.5, impact_radius_max: 1,
  },
  'Drone attack': {
    weapon: 'Attack Drone',
    chemicals: ['CO', 'VOCs', 'PM10', 'NOx'],
    co2e_min: 80, co2e_max: 200,
    impact_radius_min: 0.5, impact_radius_max: 1,
  },
  'Drone Impact': {
    weapon: 'Drone/UAS',
    chemicals: ['CO', 'VOCs', 'PM10', 'NOx'],
    co2e_min: 80, co2e_max: 200,
    impact_radius_min: 0.5, impact_radius_max: 1,
  },
  'Naval Strike': {
    weapon: 'Naval Munition',
    chemicals: ['HFO', 'SO\u2082', 'Benzene', 'PAHs'],
    co2e_min: 2000, co2e_max: 15000,
    impact_radius_min: 3, impact_radius_max: 10,
  },
  'Ground Incursion': {
    weapon: 'Ground Forces',
    chemicals: ['Diesel PM', 'Lead', 'NOx'],
    co2e_min: 50, co2e_max: 150,
    impact_radius_min: 1, impact_radius_max: 2,
  },
  'Interception': {
    weapon: 'Interceptor Missile',
    chemicals: ['HCl', 'Al\u2082O\u2083', 'NOx'],
    co2e_min: 100, co2e_max: 300,
    impact_radius_min: 0.5, impact_radius_max: 0.5,
  },
  'Defensive Fire': {
    weapon: 'Air Defense System',
    chemicals: ['HCl', 'Al\u2082O\u2083', 'NOx'],
    co2e_min: 100, co2e_max: 300,
    impact_radius_min: 0.5, impact_radius_max: 0.5,
  },
}

const DEFAULT_PROFILE = {
  weapon: 'Unknown Munition',
  chemicals: ['NOx', 'PM2.5'],
  co2e_min: 200, co2e_max: 1000,
  impact_radius_min: 1, impact_radius_max: 5,
}

export function getProfile(eventType) {
  return WEAPON_PROFILES[eventType] ?? DEFAULT_PROFILE
}
