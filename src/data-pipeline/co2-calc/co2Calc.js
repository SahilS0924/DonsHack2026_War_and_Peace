export function calculateCO2e(profile) {
  return Math.round((profile.co2e_min + profile.co2e_max) / 2)
}

export function getTotalCO2e(events) {
  const totalKg = events.reduce((sum, e) => sum + (e.co2e_estimate ?? 0), 0)
  const totalTonnes = Math.round(totalKg / 1000)
  return { kg: totalKg, tonnes: totalTonnes }
}

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
