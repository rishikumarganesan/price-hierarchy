import { Network, RefreshCcw, Settings2, Filter } from 'lucide-react'
import { useStore } from '../store/useStore'
import CalendarGrid from '../components/calendar/CalendarGrid'
import Legend from '../components/calendar/Legend'
import HierarchySlideOver from '../components/hierarchy/HierarchySlideOver'

export default function MultiCalendar() {
  const slideOverOpen = useStore((s) => s.slideOverOpen)
  const openSlideOver = useStore((s) => s.openSlideOver)
  const hierarchy = useStore((s) => s.hierarchy)
  const enforcementEnabled = useStore((s) => s.enforcementEnabled)

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Multi-Calendar</h1>
          <p className="text-sm text-gray-500">Sunset Bay Resort · 14-day view</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-md border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50">
            <Filter size={16} />
          </button>
          <button className="w-9 h-9 rounded-md border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50">
            <RefreshCcw size={16} />
          </button>
          <button className="w-9 h-9 rounded-md border border-gray-200 bg-white text-gray-500 flex items-center justify-center hover:bg-gray-50">
            <Settings2 size={16} />
          </button>
          <button
            onClick={openSlideOver}
            className={`w-9 h-9 rounded-md border flex items-center justify-center relative ${
              hierarchy
                ? 'border-[#e35454]/30 bg-[#e35454]/5 text-[#e35454] hover:bg-[#e35454]/10'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            }`}
            aria-label="Pricing Hierarchy"
          >
            <Network size={16} />
            {hierarchy && (
              <span
                className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  enforcementEnabled ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              />
            )}
          </button>
        </div>
      </div>

      <CalendarGrid />
      <Legend />

      {slideOverOpen && <HierarchySlideOver />}
    </div>
  )
}
