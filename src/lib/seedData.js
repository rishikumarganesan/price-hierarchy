// Deterministic mock data for the prototype — no backend, no randomness.

const DAY_COUNT = 14

export function isoDateForOffset(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

export const roomTypes = [
  { id: 'standard', name: 'Standard Room', order: 0 },
  { id: 'deluxe', name: 'Deluxe Room', order: 1 },
  { id: 'superior', name: 'Superior Room', order: 2 },
]

export const listings = [
  { id: 'std-a', roomTypeId: 'standard', name: 'Ocean View Room — Bldg A', tag: 'PARENT', lastUpdatedLabel: '20 mins ago' },
  { id: 'std-b', roomTypeId: 'standard', name: 'Ocean View Room — Bldg B', tag: 'CHILD', lastUpdatedLabel: '20 mins ago' },
  { id: 'dlx-a', roomTypeId: 'deluxe', name: 'Deluxe King — Bldg A', tag: 'PARENT', lastUpdatedLabel: '18 mins ago' },
  { id: 'dlx-b', roomTypeId: 'deluxe', name: 'Deluxe King — Bldg B', tag: 'CHILD', lastUpdatedLabel: '18 mins ago' },
  { id: 'sup-a', roomTypeId: 'superior', name: 'Superior Penthouse', tag: 'PARENT', lastUpdatedLabel: '5 mins ago' },
]

// Hand-picked thresholded ("algorithmic") target prices per room type per day, chosen to
// deliberately create inversions on days [1, 3, 5, 6, 8, 10] and a Max Price conflict (once
// the hierarchy is enforced) on day 10. seasonalityPct/demandPct/farOutPremiumPct are 0 (i.e.
// basePrice IS the thresholded price) except for the "hero" day (5, deluxe) which carries a
// full realistic breakdown for the tooltip demo, and day 12 (standard) which carries a
// non-zero Pricing Offset to demonstrate that row in the tooltip.
const RAW_DAY_PRICES = {
  standard: [180, 190, 175, 200, 160, 225, 170, 165, 210, 155, 300, 175, 180, 165],
  deluxe: [210, 175, 205, 230, 195, null /* hero, computed below */, 200, 190, 190, 185, 250, 205, 215, 195],
  superior: [260, 265, 250, 220, 245, 260, 210, 235, 245, 230, 230, 255, 260, 250],
}

const ROOM_TYPE_BOUNDS = {
  standard: { minPrice: 80, maxPrice: 400 },
  deluxe: { minPrice: 100, maxPrice: 450 },
  superior: { minPrice: 120, maxPrice: 500 },
}

function baseRecord(date, basePrice, roomTypeId, overrides = {}) {
  return {
    date,
    basePrice,
    seasonalityPct: 0,
    demandPct: 0,
    farOutPremiumPct: 0,
    minPrice: ROOM_TYPE_BOUNDS[roomTypeId].minPrice,
    maxPrice: ROOM_TYPE_BOUNDS[roomTypeId].maxPrice,
    pricingOffset: 0,
    ...overrides,
  }
}

export function buildSeedPrices() {
  /** @type {Record<string, Array<Object>>} */
  const pricesByRoomType = { standard: [], deluxe: [], superior: [] }

  for (let i = 0; i < DAY_COUNT; i++) {
    const date = isoDateForOffset(i)

    pricesByRoomType.standard.push(baseRecord(date, RAW_DAY_PRICES.standard[i], 'standard'))

    if (i === 5) {
      // Hero tooltip day: full seasonality/demand/far-out breakdown.
      // 180 * 1.05 * 0.95 * 1.15 ≈ 206.48 thresholded price.
      pricesByRoomType.deluxe.push(
        baseRecord(date, 180, 'deluxe', { seasonalityPct: 5, demandPct: -5, farOutPremiumPct: 15 })
      )
    } else {
      pricesByRoomType.deluxe.push(baseRecord(date, RAW_DAY_PRICES.deluxe[i], 'deluxe'))
    }

    // Day 10 gets a tight Superior maxPrice to force a Max Price conflict once the hierarchy
    // (Standard -> Deluxe +10% -> Superior +$200 fixed) is enforced: Standard final 300 ->
    // Deluxe floor 330 -> Superior floor 530, which exceeds a 500 cap.
    // The Pricing Offset demo value lives on Superior (the topmost tier) rather than an
    // anchor/mid rung — since offsets don't cascade, putting one on a room type with children
    // could make its post-offset price dip back below a child's, producing a spurious inversion.
    pricesByRoomType.superior.push(
      baseRecord(date, RAW_DAY_PRICES.superior[i], 'superior', i === 12 ? { pricingOffset: 20 } : {})
    )
  }

  return pricesByRoomType
}

export function buildSeedOccupancy() {
  /** @type {Record<string, Array<string>>} */
  const pattern = ['available', 'booked', 'booked', 'available', 'checkin', 'booked', 'checkout']
  const occupancy = {}
  for (const listing of listings) {
    occupancy[listing.id] = Array.from({ length: DAY_COUNT }, (_, i) => pattern[(i + listing.name.length) % pattern.length])
  }
  return occupancy
}

export { DAY_COUNT }
