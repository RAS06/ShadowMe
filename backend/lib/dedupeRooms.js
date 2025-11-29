function dedupeRooms(rooms) {
  if (!Array.isArray(rooms)) return []
  const map = new Map()
  for (const r of rooms) {
    if (!r || !r.id) continue
    if (!map.has(r.id)) map.set(r.id, r)
  }
  return Array.from(map.values())
}

module.exports = { dedupeRooms }
