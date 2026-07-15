import { useStore } from './store/useStore'
import TopNav from './components/TopNav'
import Toast from './components/Toast'
import ManageListings from './pages/ManageListings'
import MultiCalendar from './pages/MultiCalendar'
import CreateHierarchyModal from './components/hierarchy/CreateHierarchyModal'

function App() {
  const currentPage = useStore((s) => s.currentPage)
  const createModalOpen = useStore((s) => s.createModalOpen)

  return (
    <div className="min-h-screen w-[1440px] max-w-full mx-auto bg-[#f4f5f7] flex flex-col">
      <TopNav />
      <div className="flex-1 min-h-0">
        {currentPage === 'manageListings' ? <ManageListings /> : <MultiCalendar />}
      </div>
      {createModalOpen && <CreateHierarchyModal />}
      <Toast />
    </div>
  )
}

export default App
