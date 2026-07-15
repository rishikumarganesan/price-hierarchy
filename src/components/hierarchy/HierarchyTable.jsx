import { Pencil, Trash2, CornerDownRight } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getRoomTypeName } from '../../store/selectors'

function gapLabel(rung) {
  if (!rung.gapType) return '–'
  return rung.gapType === 'percent' ? `${rung.gapValue}%` : `$${rung.gapValue}`
}

export default function HierarchyTable() {
  const state = useStore()
  const { hierarchy, toggleSyncPrices, openEditModal, deleteHierarchy } = state

  if (!hierarchy) return null

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500">
            <th className="px-4 py-3 font-medium">Room Type</th>
            <th className="px-4 py-3 font-medium">Sync Prices</th>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Gap Type</th>
            <th className="px-4 py-3 font-medium">Gap Value</th>
          </tr>
        </thead>
        <tbody>
          {hierarchy.rungs.map((rung, i) => {
            return (
              <tr key={rung.roomTypeId} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center text-gray-800 font-medium" style={{ paddingLeft: i * 28 }}>
                    {i > 0 && <CornerDownRight size={15} className="text-gray-300 mr-2 shrink-0" />}
                    {getRoomTypeName(state, rung.roomTypeId)}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        Anchor
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {i === 0 ? (
                    <span className="text-gray-300">–</span>
                  ) : (
                    <button
                      onClick={() => toggleSyncPrices(rung.roomTypeId)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        rung.syncPrices ? 'bg-[#e35454]' : 'bg-gray-200'
                      }`}
                      aria-label="Toggle Sync Prices"
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          rung.syncPrices ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <button onClick={openEditModal} className="hover:text-gray-700" aria-label="Edit hierarchy">
                      <Pencil size={15} />
                    </button>
                    <button onClick={deleteHierarchy} className="hover:text-red-500" aria-label="Delete hierarchy">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{rung.gapType ? (rung.gapType === 'percent' ? '%' : 'Fixed') : '–'}</td>
                <td className="px-4 py-3 text-gray-600">{gapLabel(rung)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
