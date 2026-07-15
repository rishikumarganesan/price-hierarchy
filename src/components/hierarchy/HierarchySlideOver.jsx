import { X, ArrowDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getRoomTypeName } from '../../store/selectors'

function gapLabel(rung) {
  return rung.gapType === 'fixed' ? `+$${rung.gapValue}` : `+${rung.gapValue}%`
}

export default function HierarchySlideOver() {
  const state = useStore()
  const { hierarchy, closeSlideOver, openCreateModal } = state

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={closeSlideOver} />
      <div className="absolute right-0 top-0 h-full w-[40%] bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Pricing Hierarchy</h3>
          <button onClick={closeSlideOver} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hierarchy ? (
            <div className="text-center py-10">
              <p className="text-sm text-gray-500 mb-4">No hierarchy created yet.</p>
              <button
                onClick={openCreateModal}
                className="bg-[#e35454] hover:bg-[#d64545] text-white text-sm font-medium px-4 py-2 rounded-md"
              >
                Create Hierarchy
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {hierarchy.rungs.map((rung, i) => (
                <div key={rung.roomTypeId} className="w-full flex flex-col items-center">
                  <div className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{getRoomTypeName(state, rung.roomTypeId)}</p>
                      {i === 0 ? (
                        <p className="text-[11px] text-gray-400">Anchor tier</p>
                      ) : (
                        <p className="text-[11px] text-gray-400">
                          {gapLabel(rung)} above parent {rung.syncPrices && '· Synced'}
                        </p>
                      )}
                    </div>
                    {i === 0 && (
                      <span className="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                        Anchor
                      </span>
                    )}
                  </div>
                  {i < hierarchy.rungs.length - 1 && <ArrowDown size={16} className="text-gray-300 my-1.5" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
