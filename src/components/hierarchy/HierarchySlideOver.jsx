import { X, ArrowDown } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getRoomTypeName } from '../../store/selectors'

function gapLabel(rung) {
  return rung.gapType === 'fixed' ? `+$${rung.gapValue}` : `+${rung.gapValue}%`
}

export default function HierarchySlideOver() {
  const state = useStore()
  const { hierarchy, enforcementEnabled, setEnforcementEnabled, closeSlideOver, openCreateModal } = state

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={closeSlideOver} />
      <div className="absolute right-0 top-0 h-full w-[380px] bg-white shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Pricing Hierarchy</h3>
          <button onClick={closeSlideOver} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Hierarchy Enforcement</p>
              <p className="text-xs text-gray-400">Applies the guardrail to every listing below.</p>
            </div>
            <button
              onClick={() => setEnforcementEnabled(!enforcementEnabled)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                enforcementEnabled ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
              aria-label="Toggle hierarchy enforcement"
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  enforcementEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className={`text-xs font-semibold mt-2 ${enforcementEnabled ? 'text-emerald-600' : 'text-red-500'}`}>
            Enforcement: {enforcementEnabled ? 'ON' : 'OFF'}
          </p>
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
