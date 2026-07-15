import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Network, AlertTriangle } from 'lucide-react'
import { money } from '../../lib/format'
import PriceTooltip from './PriceTooltip'

const OCCUPANCY_DOT = {
  available: 'bg-gray-200',
  booked: 'bg-gray-700',
  checkin: 'bg-emerald-500',
  checkout: 'bg-orange-400',
}

const TOOLTIP_WIDTH = 288
const MARGIN = 8

// Renders into document.body (escaping any clipped/scrolling ancestor) and measures its own
// height after mount so it can flip above/below the anchor and clamp within the viewport using
// the real rendered size, rather than guessing a fixed height up front.
function PositionedTooltip({ anchorRect, children }) {
  const ref = useRef(null)
  const [style, setStyle] = useState(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const w = el.offsetWidth
    const h = el.offsetHeight

    let left = anchorRect.left + anchorRect.width / 2 - w / 2
    left = Math.max(MARGIN, Math.min(left, window.innerWidth - w - MARGIN))

    const spaceBelow = window.innerHeight - anchorRect.bottom
    const spaceAbove = anchorRect.top
    const openDownward = spaceBelow >= h + MARGIN || spaceBelow >= spaceAbove

    let top = openDownward ? anchorRect.bottom + MARGIN : anchorRect.top - MARGIN - h
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - h - MARGIN))

    setStyle({ left, top })
  }, [anchorRect])

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 pointer-events-none"
      style={{
        left: style?.left ?? -9999,
        top: style?.top ?? -9999,
        width: TOOLTIP_WIDTH,
        visibility: style ? 'visible' : 'hidden',
      }}
    >
      {children}
    </div>,
    document.body
  )
}

export default function PriceCell({ record, listingName, occupancy, inverted }) {
  const cellRef = useRef(null)
  const [anchorRect, setAnchorRect] = useState(null)
  const adjusted = record.hierarchyMeta && !record.hierarchyMeta.isAnchor && record.hierarchyMeta.triggered
  const maxConflict = record.hierarchyMeta?.maxPriceConflict

  return (
    <div
      ref={cellRef}
      onMouseEnter={() => setAnchorRect(cellRef.current.getBoundingClientRect())}
      onMouseLeave={() => setAnchorRect(null)}
      className={`relative w-[88px] h-16 shrink-0 border-r border-b border-gray-100 flex flex-col items-center justify-center gap-0.5 cursor-default
        ${inverted ? 'outline outline-2 outline-dashed outline-red-400 -outline-offset-2' : ''}
        ${adjusted ? 'bg-violet-50' : 'bg-white'}
      `}
    >
      <div className="flex items-center gap-1">
        <span className={`text-sm font-medium ${adjusted ? 'text-violet-700' : 'text-gray-800'}`}>
          ${money(record.finalPrice)}
        </span>
        {inverted && <AlertTriangle size={11} className="text-red-500" />}
      </div>
      <div className={`w-1.5 h-1.5 rounded-full ${OCCUPANCY_DOT[occupancy] || 'bg-gray-200'}`} />

      {adjusted && (
        <div className="absolute top-1 right-1 text-violet-500">
          <Network size={11} />
        </div>
      )}
      {maxConflict && (
        <div className="absolute top-1 left-1 bg-amber-400 text-white text-[8px] font-bold px-1 rounded">max</div>
      )}

      {anchorRect && (
        <PositionedTooltip anchorRect={anchorRect}>
          <PriceTooltip record={record} listingName={listingName} />
        </PositionedTooltip>
      )}
    </div>
  )
}
