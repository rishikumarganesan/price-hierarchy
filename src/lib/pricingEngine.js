// Pure pricing engine — no React, no store dependencies. Safe to unit test in isolation.
//
// Pipeline per listing/date (matches product tooltip ordering):
//   Base Price
//   -> Market Factors (seasonality, demand)        = Uncustomized Price
//   -> Price Customizations (far-out premium, etc.) = Customized Price
//   -> Thresholds (min/max clamp)                   = Thresholded ("algorithmic") Price
//   -> FINAL ADJUSTMENTS:
//        -> Pricing Hierarchy Applied
//        -> Pricing Offset
//   = Final Price

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// Runs market factors + customizations + thresholds. Independent of hierarchy.
export function computeBreakdown(record) {
  const { basePrice, seasonalityPct, demandPct, farOutPremiumPct, minPrice, maxPrice } = record
  const afterSeasonality = basePrice * (1 + seasonalityPct / 100)
  const uncustomizedPrice = afterSeasonality * (1 + demandPct / 100)
  const customizedPrice = uncustomizedPrice * (1 + farOutPremiumPct / 100)
  const thresholdedPrice = clamp(customizedPrice, minPrice, maxPrice)
  return { afterSeasonality, uncustomizedPrice, customizedPrice, thresholdedPrice }
}

/**
 * Applies the pricing hierarchy guardrail to a set of per-room-type daily prices.
 *
 * @param {Object} args
 * @param {Array<{id:string}>} args.roomTypes
 * @param {Map<string, Array<Object>>} args.pricesByRoomType roomTypeId -> raw daily price records
 * @param {{rungs: Array<{roomTypeId:string, gapType:'percent'|'fixed'|null, gapValue:number|null, syncPrices:boolean}>}|null} args.hierarchy
 *   rungs are ordered anchor-first. Anchor has gapType/gapValue = null.
 * @param {boolean} args.enforcementEnabled
 * @returns {Map<string, Map<string, Object>>} roomTypeId -> date -> computed price record
 *
 * NOTE: parent->child gap cascades off the parent's finalPriceBeforeOffset (post-threshold,
 * post-hierarchy, but pre "Pricing Offset"). Pricing Offset is treated as a manual per-listing
 * override applied last, so it does not propagate down the ladder — only the algorithmic +
 * hierarchy-guarded price does.
 */
export function applyHierarchy({ roomTypes, pricesByRoomType, hierarchy, enforcementEnabled }) {
  const result = new Map()

  for (const rt of roomTypes) {
    const records = pricesByRoomType.get(rt.id) || []
    const perDate = new Map()
    for (const rec of records) {
      perDate.set(rec.date, { ...rec, ...computeBreakdown(rec) })
    }
    result.set(rt.id, perDate)
  }

  const hasActiveHierarchy = hierarchy && hierarchy.rungs && hierarchy.rungs.length > 1 && enforcementEnabled

  if (!hasActiveHierarchy) {
    for (const perDate of result.values()) {
      for (const rec of perDate.values()) {
        rec.hierarchyMeta = null
        rec.finalPriceBeforeOffset = rec.thresholdedPrice
        rec.finalPrice = rec.thresholdedPrice + rec.pricingOffset
      }
    }
    return result
  }

  const rungs = hierarchy.rungs

  // Anchor: untouched by hierarchy.
  const anchorRoomTypeId = rungs[0].roomTypeId
  for (const rec of result.get(anchorRoomTypeId).values()) {
    rec.hierarchyMeta = { isAnchor: true }
    rec.finalPriceBeforeOffset = rec.thresholdedPrice
    rec.finalPrice = rec.thresholdedPrice + rec.pricingOffset
  }

  // Walk the ladder top-down, cascading each rung's floor off its immediate parent.
  for (let i = 1; i < rungs.length; i++) {
    const rung = rungs[i]
    const parentRung = rungs[i - 1]
    const childPerDate = result.get(rung.roomTypeId)
    const parentPerDate = result.get(parentRung.roomTypeId)

    for (const [date, rec] of childPerDate) {
      const parentRec = parentPerDate.get(date)
      const parentFinal = parentRec.finalPriceBeforeOffset
      const floor =
        rung.gapType === 'fixed' ? parentFinal + rung.gapValue : parentFinal * (1 + rung.gapValue / 100)
      const algorithmic = rec.thresholdedPrice

      let finalBeforeOffset
      let triggered
      if (rung.syncPrices) {
        finalBeforeOffset = floor
        triggered = true
      } else {
        finalBeforeOffset = Math.max(algorithmic, floor)
        triggered = floor > algorithmic
      }

      rec.finalPriceBeforeOffset = finalBeforeOffset
      rec.finalPrice = finalBeforeOffset + rec.pricingOffset

      rec.hierarchyMeta = {
        isAnchor: false,
        parentRoomTypeId: parentRung.roomTypeId,
        gapType: rung.gapType,
        gapValue: rung.gapValue,
        syncPrices: rung.syncPrices,
        floor,
        algorithmic,
        parentFinal,
        triggered,
        // Thresholded price can never exceed maxPrice on its own (it's clamped), so any
        // final price above maxPrice was necessarily pushed there by the hierarchy floor.
        maxPriceConflict: finalBeforeOffset > rec.maxPrice,
      }
    }
  }

  return result
}

/**
 * Detects tier inversions using the *displayed* final price for consecutive room types in
 * `orderedRoomTypeIds` (lowest tier first). Flags both sides of an inverted pair so the
 * calendar can highlight the whole comparison.
 *
 * @param {Map<string, Map<string, Object>>} computedByRoomType output of applyHierarchy
 * @param {string[]} orderedRoomTypeIds lowest tier first
 * @returns {Map<string, Set<string>>} roomTypeId -> set of inverted dates
 */
export function detectInversions(computedByRoomType, orderedRoomTypeIds) {
  const inverted = new Map(orderedRoomTypeIds.map((id) => [id, new Set()]))

  for (let i = 0; i < orderedRoomTypeIds.length - 1; i++) {
    const lowerId = orderedRoomTypeIds[i]
    const higherId = orderedRoomTypeIds[i + 1]
    const lowerPerDate = computedByRoomType.get(lowerId)
    const higherPerDate = computedByRoomType.get(higherId)
    if (!lowerPerDate || !higherPerDate) continue

    for (const [date, lowerRec] of lowerPerDate) {
      const higherRec = higherPerDate.get(date)
      if (!higherRec) continue
      if (higherRec.finalPrice < lowerRec.finalPrice) {
        inverted.get(lowerId).add(date)
        inverted.get(higherId).add(date)
      }
    }
  }

  return inverted
}
