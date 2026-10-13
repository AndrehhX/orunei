import { Construction, X } from 'lucide-react'

export default function DevelopmentNotice({ notice, onClose }) {
  if (!notice) return null

  return (
    <div
      key={notice.title}
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex w-[min(380px,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-brand/20 bg-white/95 p-4 shadow-2xl shadow-brand/10 backdrop-blur animate-rise dark:border-brand/30 dark:bg-[#171723]/95"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand dark:bg-brand/20">
        <Construction size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{notice.title}</p>
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand dark:bg-brand/20">Próximamente</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{notice.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
