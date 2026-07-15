import { Network } from 'lucide-react'

const ITEMS = [
  { dot: 'bg-gray-200', label: 'Available' },
  { dot: 'bg-gray-700', label: 'Booked' },
  { dot: 'bg-emerald-500', label: 'Check-in' },
  { dot: 'bg-orange-400', label: 'Check-out' },
]

export default function Legend() {
  return (
    <div className="flex items-center gap-5 text-xs text-gray-500 mt-4 flex-wrap">
      {ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${item.dot}`} />
          {item.label}
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm outline outline-2 outline-dashed outline-red-400" />
        Price Inversion
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-violet-50 border border-violet-200 flex items-center justify-center">
          <Network size={9} className="text-violet-500" />
        </span>
        Hierarchy Adjusted
      </div>
      <div className="flex items-center gap-1.5">
        <span className="bg-amber-400 text-white text-[8px] font-bold px-1 rounded">max</span>
        Above Max Price
      </div>
    </div>
  )
}
