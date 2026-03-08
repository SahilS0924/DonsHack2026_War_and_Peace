/* Fallback when live fetch fails (CORS, network, etc.) */
const BUNDLED_FEED_DATA = [
  {
    event_id: 'IRW-20260307-3205',
    type: 'Drone strike',
    timestamp: '2026-03-07T09:00:28.346Z',
    event_summary: 'Drone strike reported. Unidentified drone strikes Dubai International Airport.',
    confidence: 'News Wire',
    source_url: 'https://www.aljazeera.com/',
    _osint_meta: { casualties: '0', coordinates: { lat: '25.07736643', lng: '55.19397289' } },
  },
  {
    event_id: 'IRW-20260306-1002',
    type: 'Ballistic Missile Strike',
    timestamp: '2026-03-06T15:00:00Z',
    event_summary: 'Iranian IRGC launches strikes targeting Tel Aviv with combined drone and missile attack.',
    confidence: 'High Confidence (Multi-Source)',
    _osint_meta: { casualties: '0', coordinates: { lat: '32.0853', lng: '34.7818' } },
  },
  {
    event_id: 'IRW-20260305-0801',
    type: 'Air Strike',
    timestamp: '2026-03-05T12:00:00Z',
    event_summary: 'US-led airstrikes target Mehrabad Airport in Tehran.',
    confidence: 'US/IDF Military (High)',
    _osint_meta: { casualties: '0', coordinates: { lat: '35.6892', lng: '51.3890' } },
  },
  {
    event_id: 'IRW-20260304-2103',
    type: 'Missile attack (intercepted)',
    timestamp: '2026-03-04T21:03:00Z',
    event_summary: 'Iron Dome intercepts missile over Tel Aviv.',
    confidence: 'US/IDF Military (High)',
    _osint_meta: { casualties: '0', coordinates: { lat: '32.0800', lng: '34.7800' } },
  },
]

function parseEvents(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((e) => {
      const lat = e._osint_meta?.coordinates?.lat
      const lng = e._osint_meta?.coordinates?.lng
      return lat != null && lng != null
    })
    .map((e) => ({
      event_id: e.event_id,
      type: e.type,
      timestamp: e.timestamp,
      event_summary: e.event_summary,
      confidence: e.confidence,
      source_url: e.source_url,
      casualties: e._osint_meta?.casualties ?? '0',
      lat: parseFloat(e._osint_meta.coordinates.lat),
      lng: parseFloat(e._osint_meta.coordinates.lng),
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export async function loadFeed() {
  let raw
  try {
    const res = await fetch('https://iranwarlive.com/feed.json')
    if (!res.ok) throw new Error('fetch failed')
    const json = await res.json()
    raw = Array.isArray(json) ? json : (json?.items ?? [])
  } catch {
    raw = BUNDLED_FEED_DATA
  }
  return parseEvents(raw)
}
