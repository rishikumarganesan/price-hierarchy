import { useStore } from '../store/useStore'

const NAV_ITEMS = [
  { key: 'calendar', label: 'Multi-Calendar' },
  { key: 'manageListings', label: 'Manage Listings' },
]

export default function TopNav() {
  const currentPage = useStore((s) => s.currentPage)
  const navigate = useStore((s) => s.navigate)

  return (
    <nav className="flex items-center gap-8 bg-[#1c1d24] px-6 h-14 text-sm shrink-0">
      <div className="flex items-center gap-1.5 font-bold text-white tracking-tight text-base">
        <span className="text-[#e35454]">Price</span>
        <span>Labs</span>
      </div>
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => navigate(item.key)}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              currentPage === item.key
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3 text-gray-400 text-xs">
        <span>Pricing Hierarchy Prototype</span>
        <div className="w-7 h-7 rounded-full bg-[#e35454] text-white flex items-center justify-center text-xs font-semibold">
          RG
        </div>
      </div>
    </nav>
  )
}
