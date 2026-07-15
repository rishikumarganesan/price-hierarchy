import { applyHierarchy, detectInversions } from '../lib/pricingEngine'

function toMap(pricesByRoomType) {
  return new Map(Object.entries(pricesByRoomType).map(([id, arr]) => [id, arr]))
}

export function getComputedPrices(state) {
  return applyHierarchy({
    roomTypes: state.roomTypes,
    pricesByRoomType: toMap(state.rawPricesByRoomType),
    hierarchy: state.hierarchy,
    enforcementEnabled: state.enforcementEnabled,
  })
}

export function getOrderedRoomTypeIds(state) {
  return state.hierarchy
    ? state.hierarchy.rungs.map((r) => r.roomTypeId)
    : state.roomTypes.slice().sort((a, b) => a.order - b.order).map((rt) => rt.id)
}

export function getInversions(state) {
  const computed = getComputedPrices(state)
  return detectInversions(computed, getOrderedRoomTypeIds(state))
}

export function getRoomTypeName(state, roomTypeId) {
  return state.roomTypes.find((rt) => rt.id === roomTypeId)?.name ?? roomTypeId
}
