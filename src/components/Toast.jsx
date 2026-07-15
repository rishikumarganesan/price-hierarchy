import { useStore } from '../store/useStore'

export default function Toast() {
  const toast = useStore((s) => s.toast)
  const dismissToast = useStore((s) => s.dismissToast)

  if (!toast) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1c1d24] text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-2">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
      <span>{toast.message}</span>
      <button onClick={dismissToast} className="text-gray-400 hover:text-white ml-2">
        ✕
      </button>
    </div>
  )
}
