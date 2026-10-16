import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error) {
    const msg = String(error?.message || error || '')
    if (msg.includes('dynamically imported module') || msg.includes('Failed to fetch') || msg.includes('ChunkLoadError')) {
      const key = 'orunei_chunk_error_reload'
      const last = sessionStorage.getItem(key)
      const now = Date.now()
      if (!last || now - Number(last) > 10000) {
        sessionStorage.setItem(key, String(now))
        window.location.reload()
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    const msg = String(this.state.error?.message || this.state.error || '')
    const isChunkError = msg.includes('dynamically imported module') || msg.includes('Failed to fetch') || msg.includes('ChunkLoadError')

    if (isChunkError) {
      return (
        <div className="grid min-h-screen place-items-center p-6 bg-[#0e0e17] text-white">
          <div className="max-w-md w-full rounded-3xl bg-[#161824] p-8 border border-white/10 text-center shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-brand/20 text-brand grid place-items-center mx-auto text-xl font-bold">↻</div>
            <h1 className="text-xl font-extrabold">Nueva versión disponible</h1>
            <p className="text-sm text-slate-400">
              Se ha actualizado Orunei con nuevas mejoras. Pulsa el botón para cargar la última versión.
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem('orunei_chunk_error_reload')
                window.location.reload()
              }}
              className="w-full py-3 px-6 rounded-xl bg-brand text-white font-bold hover:brightness-110 transition active:scale-95 shadow-lg shadow-brand/30"
            >
              Actualizar aplicación
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="grid min-h-screen place-items-center p-6 bg-slate-50 dark:bg-[#0e0e17]">
        <div className="max-w-lg w-full rounded-2xl bg-white dark:bg-[#161824] p-6 shadow-xl border border-slate-200 dark:border-white/10">
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">Algo salió mal</h1>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-rose-500 bg-rose-500/10 p-3 rounded-lg overflow-x-auto">{msg}</pre>
          <div className="mt-4 flex gap-3">
            <button onClick={() => window.location.reload()} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:brightness-110 transition">Reintentar</button>
            <button onClick={() => { localStorage.clear(); window.location.reload() }} className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Restablecer datos</button>
          </div>
        </div>
      </div>
    )
  }
}
