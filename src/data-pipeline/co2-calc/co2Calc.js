export function calculateCO2e(profile) {
  return Math.round((profile.co2e_min + profile.co2e_max) / 2)
}

export function getTotalCO2e(events) {
  const kg = events.reduce((sum, e) => sum + (e.co2e_estimate ?? 0), 0)
  return { kg, tonnes: Math.round(kg / 1000) }
}

export function formatEquivalency(totalKg) {
  const tonnes = totalKg / 1000
  if (tonnes >= 1000) return `\u2248 ${Math.round(tonnes / 1000).toLocaleString()} village annual emissions`
  if (tonnes >= 100)  return `\u2248 ${Math.round(tonnes * 5000).toLocaleString()} km driven`
  if (tonnes >= 10)   return `\u2248 ${Math.round(tonnes / 10).toLocaleString()} person-years`
  return `\u2248 ${Math.round(totalKg / 250).toLocaleString()} LHR\u2013JFK flights`
}
