const { dedupeRooms } = require('../lib/dedupeRooms')

describe('dedupeRooms', () => {
  test('returns empty array for non-array input', () => {
    expect(dedupeRooms(null)).toEqual([])
    expect(dedupeRooms(undefined)).toEqual([])
    expect(dedupeRooms({})).toEqual([])
  })

  test('removes duplicate room ids preserving first occurrence', () => {
    const rooms = [
      { id: 'appt:doc1:stu1', doctorName: 'Dr A' },
      { id: 'appt:doc1:stu1', doctorName: 'Dr A (duplicate)' },
      { id: 'appt:doc2:stu1', doctorName: 'Dr B' },
    ]
    const out = dedupeRooms(rooms)
    expect(out.length).toBe(2)
    expect(out[0].doctorName).toBe('Dr A')
    expect(out[1].id).toBe('appt:doc2:stu1')
  })

  test('skips invalid entries', () => {
    const rooms = [null, { foo: 'bar' }, { id: 'r1' }, { id: 'r1' }]
    const out = dedupeRooms(rooms)
    expect(out).toEqual([{ id: 'r1' }])
  })
})
