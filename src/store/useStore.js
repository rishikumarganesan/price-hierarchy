import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { roomTypes, listings, buildSeedPrices, buildSeedOccupancy } from '../lib/seedData'

export const useStore = create((set, get) => ({
  roomTypes,
  listings,
  rawPricesByRoomType: buildSeedPrices(),
  occupancy: buildSeedOccupancy(),

  hierarchy: null,
  enforcementEnabled: true,

  currentPage: 'calendar', // 'calendar' | 'manageListings'
  manageListingsTab: 'hierarchy', // 'unmapped' | 'mapped' | 'hierarchy'

  createModalOpen: false,
  slideOverOpen: false,
  editingHierarchy: false,

  toast: null,

  navigate: (page) => set({ currentPage: page }),
  setManageListingsTab: (tab) => set({ manageListingsTab: tab }),

  openCreateModal: () => set({ createModalOpen: true, editingHierarchy: false }),
  openEditModal: () => set({ createModalOpen: true, editingHierarchy: true }),
  closeCreateModal: () => set({ createModalOpen: false }),

  openSlideOver: () => set({ slideOverOpen: true }),
  closeSlideOver: () => set({ slideOverOpen: false }),

  setEnforcementEnabled: (enabled) => set({ enforcementEnabled: enabled }),

  showToast: (message) => {
    const id = uuid()
    set({ toast: { id, message } })
    setTimeout(() => {
      if (get().toast?.id === id) set({ toast: null })
    }, 4000)
  },
  dismissToast: () => set({ toast: null }),

  createHierarchy: (rungs) => {
    set({
      hierarchy: { id: uuid(), rungs },
      enforcementEnabled: true,
      createModalOpen: false,
      currentPage: 'calendar',
    })
    get().showToast('Pricing Hierarchy created. Prices on the Multi-Calendar have been updated.')
  },

  updateHierarchy: (rungs) => {
    set((state) => ({ hierarchy: { ...state.hierarchy, rungs }, createModalOpen: false }))
    get().showToast('Pricing Hierarchy updated. Prices on the Multi-Calendar have been updated.')
  },

  deleteHierarchy: () => {
    set({ hierarchy: null })
    get().showToast('Pricing Hierarchy deleted.')
  },

  toggleSyncPrices: (roomTypeId) => {
    set((state) => {
      if (!state.hierarchy) return state
      const rungs = state.hierarchy.rungs.map((r) =>
        r.roomTypeId === roomTypeId ? { ...r, syncPrices: !r.syncPrices } : r
      )
      return { hierarchy: { ...state.hierarchy, rungs } }
    })
  },
}))
