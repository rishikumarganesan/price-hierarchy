import { useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { GripVertical, Plus, Trash2, Info, X } from 'lucide-react'
import { useStore } from '../../store/useStore'

function emptyRow() {
  return { id: uuid(), roomTypeId: '', gapType: 'percent', gapValue: '' }
}

function initialRows(hierarchy) {
  if (hierarchy) {
    return hierarchy.rungs.map((r) => ({
      id: uuid(),
      roomTypeId: r.roomTypeId,
      gapType: r.gapType ?? 'percent',
      gapValue: r.gapValue == null ? '' : String(r.gapValue),
    }))
  }
  return [emptyRow(), emptyRow()]
}

export default function CreateHierarchyModal() {
  const roomTypes = useStore((s) => s.roomTypes)
  const hierarchy = useStore((s) => s.hierarchy)
  const editingHierarchy = useStore((s) => s.editingHierarchy)
  const createHierarchy = useStore((s) => s.createHierarchy)
  const updateHierarchy = useStore((s) => s.updateHierarchy)
  const closeCreateModal = useStore((s) => s.closeCreateModal)

  const [rows, setRows] = useState(() => initialRows(editingHierarchy ? hierarchy : null))
  const [dragId, setDragId] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const errors = useMemo(() => computeErrors(rows), [rows])
  const hasErrors = Object.keys(errors).length > 0

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(id) {
    setRows((prev) => (prev.length <= 2 ? prev : prev.filter((r) => r.id !== id)))
  }

  function handleDrop(targetId) {
    if (!dragId || dragId === targetId) return
    setRows((prev) => {
      const from = prev.findIndex((r) => r.id === dragId)
      const to = prev.findIndex((r) => r.id === targetId)
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setDragId(null)
  }

  function handleSubmit() {
    setSubmitted(true)
    if (hasErrors) return

    const prevSyncByRoomType = new Map((hierarchy?.rungs ?? []).map((r) => [r.roomTypeId, r.syncPrices]))
    const rungs = rows.map((r, i) => ({
      roomTypeId: r.roomTypeId,
      gapType: i === 0 ? null : r.gapType,
      gapValue: i === 0 ? null : Number(r.gapValue),
      syncPrices: prevSyncByRoomType.get(r.roomTypeId) ?? false,
    }))

    if (editingHierarchy) {
      updateHierarchy(rungs)
    } else {
      createHierarchy(rungs)
    }
  }

  const usedRoomTypeIds = new Set(rows.map((r) => r.roomTypeId).filter(Boolean))

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={closeCreateModal} />
      <div className="absolute right-0 top-0 h-full w-[40%] bg-white shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingHierarchy ? 'Edit Pricing Hierarchy' : 'Create Pricing Hierarchy'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Define an ordered ladder of room types.{' '}
              <a href="#" onClick={(e) => e.preventDefault()} className="text-[#e35454] hover:underline">
                Learn More
              </a>
            </p>
          </div>
          <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 text-blue-900 text-xs rounded-lg px-3 py-2.5 mb-5">
            <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p>
              Pricing Hierarchy acts as a guardrail layer applied after algorithmic pricing but before final prices
              are surfaced. It ensures that superior room categories are never priced lower than inferior categories.
            </p>
          </div>
        </div>

        <div className="px-6 flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-[24px_1fr_100px_110px_28px] gap-3 text-xs font-medium text-gray-400 pb-2 px-1">
            <div />
            <div>Room Type</div>
            <div>Gap Type</div>
            <div>Gap Value</div>
            <div />
          </div>

          <div className="space-y-2 pb-4">
            {rows.map((row, i) => {
              const rowErrors = errors[row.id] || {}
              const isAnchor = i === 0
              return (
                <div
                  key={row.id}
                  draggable
                  onDragStart={() => setDragId(row.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(row.id)}
                  className={`grid grid-cols-[24px_1fr_100px_110px_28px] gap-3 items-center px-1 py-1 rounded-md ${
                    dragId === row.id ? 'opacity-40' : ''
                  }`}
                >
                  <div className="cursor-grab text-gray-300 hover:text-gray-500 flex justify-center">
                    <GripVertical size={16} />
                  </div>

                  <div>
                    <select
                      value={row.roomTypeId}
                      onChange={(e) => updateRow(row.id, { roomTypeId: e.target.value })}
                      className={`w-full border rounded-md px-2.5 py-2 text-sm bg-white ${
                        submitted && rowErrors.roomType ? 'border-red-400' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Select room type…</option>
                      {roomTypes.map((rt) => (
                        <option
                          key={rt.id}
                          value={rt.id}
                          disabled={usedRoomTypeIds.has(rt.id) && rt.id !== row.roomTypeId}
                        >
                          {rt.name}
                        </option>
                      ))}
                    </select>
                    {submitted && rowErrors.roomType && (
                      <p className="text-[11px] text-red-500 mt-1">{rowErrors.roomType}</p>
                    )}
                    {isAnchor && !rowErrors.roomType && (
                      <p className="text-[11px] text-gray-400 mt-1">Anchor — priced by the algorithm only</p>
                    )}
                  </div>

                  {isAnchor ? (
                    <>
                      <div className="text-gray-300 text-sm text-center">–</div>
                      <div className="text-gray-300 text-sm text-center">–</div>
                    </>
                  ) : (
                    <>
                      <select
                        value={row.gapType}
                        onChange={(e) => updateRow(row.id, { gapType: e.target.value })}
                        className="w-full border border-gray-200 rounded-md px-2 py-2 text-sm bg-white"
                      >
                        <option value="percent">%</option>
                        <option value="fixed">Fixed</option>
                      </select>

                      <div>
                        <div className="relative">
                          {row.gapType === 'fixed' && (
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                              $
                            </span>
                          )}
                          <input
                            type="number"
                            min="0"
                            value={row.gapValue}
                            onChange={(e) => updateRow(row.id, { gapValue: e.target.value })}
                            className={`w-full border rounded-md py-2 text-sm ${
                              row.gapType === 'fixed' ? 'pl-6 pr-2' : 'pl-2.5 pr-6'
                            } ${submitted && rowErrors.gapValue ? 'border-red-400' : 'border-gray-200'}`}
                            placeholder="0"
                          />
                          {row.gapType === 'percent' && (
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                              %
                            </span>
                          )}
                        </div>
                        {submitted && rowErrors.gapValue && (
                          <p className="text-[11px] text-red-500 mt-1">{rowErrors.gapValue}</p>
                        )}
                      </div>
                    </>
                  )}

                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 2}
                    className="text-gray-300 hover:text-red-500 disabled:opacity-30 disabled:hover:text-gray-300 flex justify-center"
                    aria-label="Remove room type"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            onClick={addRow}
            className="text-[#e35454] hover:text-[#d64545] text-sm font-medium flex items-center gap-1 mb-4"
          >
            <Plus size={15} /> Add Room Type
          </button>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={closeCreateModal}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#e35454] hover:bg-[#d64545] text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
          >
            {editingHierarchy ? 'Save Changes' : 'Create Hierarchy'}
          </button>
        </div>
      </div>
    </div>
  )
}

function computeErrors(rows) {
  const errors = {}
  const seen = new Map()

  rows.forEach((row) => {
    if (row.roomTypeId) {
      seen.set(row.roomTypeId, (seen.get(row.roomTypeId) || 0) + 1)
    }
  })

  rows.forEach((row, i) => {
    const rowErrors = {}
    if (!row.roomTypeId) {
      rowErrors.roomType = 'Select a room type'
    } else if (seen.get(row.roomTypeId) > 1) {
      rowErrors.roomType = 'Room type already used in this hierarchy'
    }

    if (i > 0) {
      const value = Number(row.gapValue)
      if (row.gapValue === '' || Number.isNaN(value) || value <= 0) {
        rowErrors.gapValue = 'Must be greater than 0'
      }
    }

    if (Object.keys(rowErrors).length > 0) errors[row.id] = rowErrors
  })

  if (rows.length < 2) {
    errors._global = 'A hierarchy needs at least 2 room types'
  }

  return errors
}
