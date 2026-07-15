import { useState } from 'react'
import { Home, Info } from 'lucide-react'
import { useStore } from '../store/useStore'
import HierarchyTable from '../components/hierarchy/HierarchyTable'

const TABS = [
  { key: 'unmapped', label: 'Unmapped Listings' },
  { key: 'mapped', label: 'Mapped Listings' },
  { key: 'hierarchy', label: 'Pricing Hierarchy' },
]

function InfoBanner() {
  return (
    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-lg px-4 py-3 mb-6">
      <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
      <p>
        Pricing Hierarchy acts as a guardrail layer applied after algorithmic pricing but before final prices are
        surfaced. It ensures that superior room categories are never priced lower than inferior categories.
      </p>
    </div>
  )
}

function EmptyState() {
  const openCreateModal = useStore((s) => s.openCreateModal)
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <Home size={34} className="text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">No Pricing Hierarchy Found</h3>
      <p className="text-gray-500 text-sm mb-6">Click the "Create Hierarchy" button on the top right</p>
      <button
        onClick={openCreateModal}
        className="bg-[#e35454] hover:bg-[#d64545] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
      >
        Create Hierarchy
      </button>
    </div>
  )
}

function PlaceholderTab({ label }) {
  return <div className="py-24 text-center text-gray-400 text-sm">{label} content is not part of this prototype.</div>
}

export default function ManageListings() {
  const [tab, setTab] = useState('hierarchy')
  const hierarchy = useStore((s) => s.hierarchy)
  const openCreateModal = useStore((s) => s.openCreateModal)

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Manage Listings</h1>
        {tab === 'hierarchy' && hierarchy && (
          <button
            onClick={openCreateModal}
            className="bg-[#e35454] hover:bg-[#d64545] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            Create Hierarchy
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-[#e35454] text-[#e35454]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'hierarchy' && (
        <>
          <InfoBanner />
          {hierarchy ? <HierarchyTable /> : <EmptyState />}
        </>
      )}
      {tab === 'unmapped' && <PlaceholderTab label="Unmapped Listings" />}
      {tab === 'mapped' && <PlaceholderTab label="Mapped Listings" />}
    </div>
  )
}
