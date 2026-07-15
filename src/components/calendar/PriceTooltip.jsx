import { AlertTriangle } from 'lucide-react'
import { money } from '../../lib/format'
import { getRoomTypeName } from '../../store/selectors'
import { useStore } from '../../store/useStore'

function Row({ label, pct, value, bold, muted }) {
  return (
    <div className={`flex items-center justify-between text-xs py-0.5 ${bold ? 'font-semibold text-gray-900' : muted ? 'text-gray-400' : 'text-gray-600'}`}>
      <span className={bold ? '' : 'pl-2'}>{label}</span>
      <span className="flex items-center gap-2 tabular-nums">
        {pct != null && <span className="text-gray-400">{pct}</span>}
        <span>{value}</span>
      </span>
    </div>
  )
}

function SectionHeader({ children }) {
  return <div className="text-[10px] font-semibold text-gray-400 tracking-wide mt-2 mb-0.5 first:mt-0">{children}</div>
}

export default function PriceTooltip({ record, listingName }) {
  const state = useStore()
  const meta = record.hierarchyMeta

  const gapDisplay =
    meta && !meta.isAnchor ? (meta.gapType === 'fixed' ? `$${meta.gapValue}` : `${meta.gapValue}%`) : null
  const parentName = meta && !meta.isAnchor ? getRoomTypeName(state, meta.parentRoomTypeId) : null

  return (
    <div className="w-72 bg-white rounded-lg shadow-2xl border border-gray-100 px-3.5 py-3 text-left">
      <p className="text-xs font-semibold text-gray-800 mb-1.5">{listingName}</p>

      <Row label="BASE PRICE (Listing)" value={`${money(record.basePrice)} USD`} bold />

      <SectionHeader>MARKET FACTORS</SectionHeader>
      <Row label="Seasonality" pct={`${record.seasonalityPct >= 0 ? '+' : ''}${record.seasonalityPct}%`} value={`${money(record.afterSeasonality)} USD`} />
      <Row label="Demand Factor" pct={`${record.demandPct >= 0 ? '+' : ''}${record.demandPct}%`} value={`${money(record.uncustomizedPrice)} USD`} />
      <Row label="Uncustomized Price" value={`${money(record.uncustomizedPrice)} USD`} bold />

      <SectionHeader>PRICE CUSTOMIZATIONS</SectionHeader>
      <Row
        label="Far Out Premium (Default)"
        pct={`${record.farOutPremiumPct >= 0 ? '+' : ''}${record.farOutPremiumPct}%`}
        value={`${money(record.customizedPrice)} USD`}
      />
      <Row label="Customized Price" value={`${money(record.customizedPrice)} USD`} bold />

      <SectionHeader>THRESHOLDS</SectionHeader>
      <Row label="Min Price" value={`${money(record.minPrice)} USD`} />
      <Row label="Max Price" value={`${money(record.maxPrice)} USD`} />

      <SectionHeader>FINAL ADJUSTMENTS</SectionHeader>
      {!meta || meta.isAnchor ? (
        <Row label="Pricing Hierarchy — not applicable (anchor room type)" muted />
      ) : meta.triggered ? (
        <>
          <Row label="Pricing Hierarchy Applied" bold />
          <Row
            label={`(${gapDisplay} above ${parentName})`}
            pct={meta.gapType === 'fixed' ? `+$${meta.gapValue}` : `+${meta.gapValue}%`}
            value={`${money(record.finalPriceBeforeOffset)} USD`}
          />
        </>
      ) : (
        <Row label={`Pricing Hierarchy (not triggered — price already above ${parentName} +${gapDisplay})`} muted />
      )}

      {record.pricingOffset !== 0 && (
        <Row label="Pricing Offset" pct={`${record.pricingOffset >= 0 ? '+' : ''}${record.pricingOffset}`} value={`${money(record.finalPrice)} USD`} />
      )}

      {meta?.maxPriceConflict && (
        <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-md px-2 py-1.5 mt-2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>
            Hierarchy pushed price above Max Price (${money(record.maxPrice)}). Consider raising Max Price for this
            room type.
          </span>
        </div>
      )}

      <div className="border-t border-gray-100 mt-2 pt-1.5 flex items-center justify-between text-sm font-semibold text-gray-900">
        <span>Final</span>
        <span>{money(record.finalPrice)} USD</span>
      </div>
    </div>
  )
}
