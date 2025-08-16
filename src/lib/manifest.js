export async function getTrackIds() {
  // Always try public/tracks.json first
  try {
    const res = await fetch(`/tracks.json?ts=${Date.now()}`)
    if (res.ok) {
      const json = await res.json()
      if (Array.isArray(json?.tracks)) {
        const ids = json.tracks
          .map(t => Number(t.id))
          .filter(n => Number.isFinite(n))
        if (ids.length > 0) return ids
      }
    }
  } catch (e) {
    console.warn('tracks.json not found or invalid; falling back', e)
  }

  // Fallback to .env VITE_TRACK_IDS
  const envList = (import.meta.env.VITE_TRACK_IDS ?? '')
    .split(',')
    .map(s => Number(s.trim()))
    .filter(n => Number.isFinite(n))
  if (envList.length > 0) return envList

  // Final fallback to default token
  const fallback = Number(import.meta.env.VITE_DEFAULT_TOKEN_ID ?? 0)
  return [fallback]
}
