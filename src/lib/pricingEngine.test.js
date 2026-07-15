import { describe, it, expect } from 'vitest'
import { applyHierarchy, detectInversions, computeBreakdown, clamp } from './pricingEngine'

const roomTypes = [{ id: 'standard' }, { id: 'deluxe' }, { id: 'superior' }]

function rec(overrides) {
  return {
    date: '2026-07-15',
    basePrice: 100,
    seasonalityPct: 0,
    demandPct: 0,
    farOutPremiumPct: 0,
    minPrice: 0,
    maxPrice: 100000,
    pricingOffset: 0,
    ...overrides,
  }
}

function pricesMap({ standard, deluxe, superior }) {
  return new Map([
    ['standard', [rec({ basePrice: standard })]],
    ['deluxe', [rec({ basePrice: deluxe })]],
    ['superior', [rec({ basePrice: superior })]],
  ])
}

const percentThenFixedHierarchy = {
  rungs: [
    { roomTypeId: 'standard', gapType: null, gapValue: null, syncPrices: false },
    { roomTypeId: 'deluxe', gapType: 'percent', gapValue: 10, syncPrices: false },
    { roomTypeId: 'superior', gapType: 'fixed', gapValue: 200, syncPrices: false },
  ],
}

describe('computeBreakdown / clamp', () => {
  it('clamps within min/max', () => {
    expect(clamp(50, 0, 100)).toBe(50)
    expect(clamp(-10, 0, 100)).toBe(0)
    expect(clamp(150, 0, 100)).toBe(100)
  })

  it('applies seasonality, demand, far-out premium, then thresholds in order', () => {
    const { uncustomizedPrice, customizedPrice, thresholdedPrice } = computeBreakdown(
      rec({ basePrice: 700, seasonalityPct: 5, demandPct: -3, farOutPremiumPct: 15, minPrice: 200, maxPrice: 1000 })
    )
    expect(uncustomizedPrice).toBeCloseTo(700 * 1.05 * 0.97, 5)
    expect(customizedPrice).toBeCloseTo(uncustomizedPrice * 1.15, 5)
    expect(thresholdedPrice).toBeCloseTo(customizedPrice, 5)
  })
})

describe('applyHierarchy — cascade ordering', () => {
  it('computes each rung floor from its immediate parent, not the anchor', () => {
    // Standard 100 (anchor) -> Deluxe floor 110 (100 * 1.10) -> Superior floor 310 (110 + 200)
    const prices = pricesMap({ standard: 100, deluxe: 50, superior: 50 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: percentThenFixedHierarchy,
      enforcementEnabled: true,
    })
    const date = '2026-07-15'
    expect(computed.get('standard').get(date).finalPrice).toBe(100)
    expect(computed.get('deluxe').get(date).finalPrice).toBeCloseTo(110, 5)
    // Superior's floor must be 110 + 200 = 310, NOT 100 + 200 = 300 (would be wrong if
    // gaps were relative to the anchor instead of the immediate parent).
    expect(computed.get('superior').get(date).finalPrice).toBeCloseTo(310, 5)
  })
})

describe('applyHierarchy — guardrail vs sync mode', () => {
  it('guardrail mode only bumps prices up, never pulls them down', () => {
    // Deluxe algorithmic (200) already exceeds floor (110) -> left alone.
    const prices = pricesMap({ standard: 100, deluxe: 200, superior: 50 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: percentThenFixedHierarchy,
      enforcementEnabled: true,
    })
    const deluxeRec = computed.get('deluxe').get('2026-07-15')
    expect(deluxeRec.finalPrice).toBe(200)
    expect(deluxeRec.hierarchyMeta.triggered).toBe(false)
  })

  it('guardrail mode bumps prices up to the floor when algorithmic price is too low', () => {
    const prices = pricesMap({ standard: 100, deluxe: 50, superior: 50 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: percentThenFixedHierarchy,
      enforcementEnabled: true,
    })
    const deluxeRec = computed.get('deluxe').get('2026-07-15')
    expect(deluxeRec.finalPrice).toBeCloseTo(110, 5)
    expect(deluxeRec.hierarchyMeta.triggered).toBe(true)
  })

  it('sync mode pegs the child exactly to parent + gap regardless of algorithmic price', () => {
    const syncHierarchy = {
      rungs: [
        { roomTypeId: 'standard', gapType: null, gapValue: null, syncPrices: false },
        { roomTypeId: 'deluxe', gapType: 'percent', gapValue: 10, syncPrices: true },
        { roomTypeId: 'superior', gapType: 'fixed', gapValue: 200, syncPrices: false },
      ],
    }
    // Deluxe algorithmic price (500) is way above floor (110), but sync mode pegs it anyway.
    const prices = pricesMap({ standard: 100, deluxe: 500, superior: 50 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: syncHierarchy,
      enforcementEnabled: true,
    })
    const deluxeRec = computed.get('deluxe').get('2026-07-15')
    expect(deluxeRec.finalPrice).toBeCloseTo(110, 5)
    expect(deluxeRec.hierarchyMeta.triggered).toBe(true)
  })
})

describe('applyHierarchy — fixed vs percent gaps', () => {
  it('percent gap floor = parent * (1 + gap/100)', () => {
    const prices = pricesMap({ standard: 200, deluxe: 0, superior: 0 })
    const hierarchy = {
      rungs: [
        { roomTypeId: 'standard', gapType: null, gapValue: null, syncPrices: false },
        { roomTypeId: 'deluxe', gapType: 'percent', gapValue: 25, syncPrices: false },
      ],
    }
    const computed = applyHierarchy({
      roomTypes: roomTypes.slice(0, 2),
      pricesByRoomType: prices,
      hierarchy,
      enforcementEnabled: true,
    })
    expect(computed.get('deluxe').get('2026-07-15').finalPrice).toBeCloseTo(250, 5)
  })

  it('fixed gap floor = parent + gap', () => {
    const prices = pricesMap({ standard: 200, deluxe: 0, superior: 0 })
    const hierarchy = {
      rungs: [
        { roomTypeId: 'standard', gapType: null, gapValue: null, syncPrices: false },
        { roomTypeId: 'deluxe', gapType: 'fixed', gapValue: 75, syncPrices: false },
      ],
    }
    const computed = applyHierarchy({
      roomTypes: roomTypes.slice(0, 2),
      pricesByRoomType: prices,
      hierarchy,
      enforcementEnabled: true,
    })
    expect(computed.get('deluxe').get('2026-07-15').finalPrice).toBeCloseTo(275, 5)
  })
})

describe('applyHierarchy — max price conflict flagging', () => {
  it('flags a conflict when the hierarchy floor pushes the price above maxPrice', () => {
    const prices = new Map([
      ['standard', [rec({ basePrice: 900, maxPrice: 1000 })]],
      ['deluxe', [rec({ basePrice: 50, maxPrice: 1000 })]],
    ])
    const hierarchy = {
      rungs: [
        { roomTypeId: 'standard', gapType: null, gapValue: null, syncPrices: false },
        { roomTypeId: 'deluxe', gapType: 'fixed', gapValue: 200, syncPrices: false },
      ],
    }
    const computed = applyHierarchy({
      roomTypes: roomTypes.slice(0, 2),
      pricesByRoomType: prices,
      hierarchy,
      enforcementEnabled: true,
    })
    const deluxeRec = computed.get('deluxe').get('2026-07-15')
    expect(deluxeRec.finalPriceBeforeOffset).toBe(1100)
    expect(deluxeRec.hierarchyMeta.maxPriceConflict).toBe(true)
  })

  it('does not flag a conflict when the final price stays within maxPrice', () => {
    const prices = new Map([
      ['standard', [rec({ basePrice: 100, maxPrice: 1000 })]],
      ['deluxe', [rec({ basePrice: 50, maxPrice: 1000 })]],
    ])
    const hierarchy = {
      rungs: [
        { roomTypeId: 'standard', gapType: null, gapValue: null, syncPrices: false },
        { roomTypeId: 'deluxe', gapType: 'fixed', gapValue: 20, syncPrices: false },
      ],
    }
    const computed = applyHierarchy({
      roomTypes: roomTypes.slice(0, 2),
      pricesByRoomType: prices,
      hierarchy,
      enforcementEnabled: true,
    })
    expect(computed.get('deluxe').get('2026-07-15').hierarchyMeta.maxPriceConflict).toBe(false)
  })
})

describe('applyHierarchy — disabled / missing hierarchy', () => {
  it('leaves prices untouched (thresholded + offset only) when enforcement is off', () => {
    const prices = pricesMap({ standard: 220, deluxe: 195, superior: 50 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: percentThenFixedHierarchy,
      enforcementEnabled: false,
    })
    const deluxeRec = computed.get('deluxe').get('2026-07-15')
    expect(deluxeRec.finalPrice).toBe(195)
    expect(deluxeRec.hierarchyMeta).toBeNull()
  })

  it('leaves prices untouched when there is no hierarchy at all', () => {
    const prices = pricesMap({ standard: 220, deluxe: 195, superior: 50 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: null,
      enforcementEnabled: true,
    })
    expect(computed.get('deluxe').get('2026-07-15').finalPrice).toBe(195)
  })
})

describe('applyHierarchy — idempotency', () => {
  it('running enforcement twice on the same raw input produces identical results', () => {
    const prices = pricesMap({ standard: 220, deluxe: 50, superior: 50 })
    const args = {
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: percentThenFixedHierarchy,
      enforcementEnabled: true,
    }
    const first = applyHierarchy(args)
    const second = applyHierarchy(args)
    for (const rtId of ['standard', 'deluxe', 'superior']) {
      expect(second.get(rtId).get('2026-07-15').finalPrice).toBe(first.get(rtId).get('2026-07-15').finalPrice)
    }
  })
})

describe('applyHierarchy — pricing offset', () => {
  it('adds the offset to the final price without letting it affect the child floor', () => {
    // Standard offset +25 should NOT flow into Deluxe's floor calc (which uses Standard's
    // pre-offset final price), even though it does bump Standard's own displayed final price.
    const prices = new Map([
      ['standard', [rec({ basePrice: 180, pricingOffset: 25 })]],
      ['deluxe', [rec({ basePrice: 50 })]],
    ])
    const hierarchy = {
      rungs: [
        { roomTypeId: 'standard', gapType: null, gapValue: null, syncPrices: false },
        { roomTypeId: 'deluxe', gapType: 'percent', gapValue: 10, syncPrices: false },
      ],
    }
    const computed = applyHierarchy({
      roomTypes: roomTypes.slice(0, 2),
      pricesByRoomType: prices,
      hierarchy,
      enforcementEnabled: true,
    })
    const standardRec = computed.get('standard').get('2026-07-15')
    const deluxeRec = computed.get('deluxe').get('2026-07-15')
    expect(standardRec.finalPrice).toBe(205) // 180 + 25
    expect(deluxeRec.hierarchyMeta.parentFinal).toBe(180) // pre-offset, not 205
    expect(deluxeRec.finalPrice).toBeCloseTo(198, 5) // 180 * 1.10
  })
})

describe('detectInversions', () => {
  it('flags both sides of an inverted pair', () => {
    const prices = pricesMap({ standard: 220, deluxe: 195, superior: 400 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: null,
      enforcementEnabled: false,
    })
    const inverted = detectInversions(computed, ['standard', 'deluxe', 'superior'])
    expect(inverted.get('standard').has('2026-07-15')).toBe(true)
    expect(inverted.get('deluxe').has('2026-07-15')).toBe(true)
    expect(inverted.get('superior').has('2026-07-15')).toBe(false)
  })

  it('finds no inversions once hierarchy enforcement resolves them', () => {
    const prices = pricesMap({ standard: 220, deluxe: 195, superior: 50 })
    const computed = applyHierarchy({
      roomTypes,
      pricesByRoomType: prices,
      hierarchy: percentThenFixedHierarchy,
      enforcementEnabled: true,
    })
    const inverted = detectInversions(computed, ['standard', 'deluxe', 'superior'])
    for (const rtId of ['standard', 'deluxe', 'superior']) {
      expect(inverted.get(rtId).size).toBe(0)
    }
  })
})
