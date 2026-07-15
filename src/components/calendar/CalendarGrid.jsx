import { useStore } from '../../store/useStore'
import { getComputedPrices, getInversions } from '../../store/selectors'
import { formatDateHeader } from '../../lib/format'
import PriceCell from './PriceCell'

const TAG_STYLE = {
  PARENT: 'bg-orange-100 text-orange-700',
  CHILD: 'bg-red-100 text-red-700',
}

export default function CalendarGrid() {
  const state = useStore()
  const { listings, rawPricesByRoomType, occupancy } = state
  const computed = getComputedPrices(state)
  const inversions = getInversions(state)

  const dates = rawPricesByRoomType.standard.map((r) => r.date)

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex">
            <div className="sticky left-0 z-20 w-[260px] shrink-0 bg-gray-50 border-r border-b border-gray-200" />
            {dates.map((date) => {
              const { weekday, day } = formatDateHeader(date)
              return (
                <div
                  key={date}
                  className="w-[88px] shrink-0 border-r border-b border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-1.5"
                >
                  <span className="text-[10px] text-gray-400">{weekday}</span>
                  <span className="text-sm font-medium text-gray-700">{day}</span>
                </div>
              )
            })}
          </div>

          {/* Listing rows */}
          {listings.map((listing) => {
            const roomTypePerDate = computed.get(listing.roomTypeId)
            const invertedDates = inversions.get(listing.roomTypeId) ?? new Set()
            const listingOccupancy = occupancy[listing.id] ?? []

            return (
              <div key={listing.id} className="flex">
                <div className="sticky left-0 z-10 w-[260px] shrink-0 bg-white border-r border-b border-gray-100 px-3 py-2 flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TAG_STYLE[listing.tag]}`}>
                      {listing.tag}
                    </span>
                    <span className="text-sm text-gray-800 font-medium truncate">{listing.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span>{listing.lastUpdatedLabel}</span>
                    {invertedDates.size > 0 && (
                      <span className="bg-red-50 text-red-600 font-medium px-1.5 py-0.5 rounded">
                        Price inversion on {invertedDates.size} dates
                      </span>
                    )}
                  </div>
                </div>

                {dates.map((date, i) => {
                  const record = roomTypePerDate.get(date)
                  return (
                    <PriceCell
                      key={date}
                      record={record}
                      listingName={listing.name}
                      occupancy={listingOccupancy[i]}
                      inverted={invertedDates.has(date)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
