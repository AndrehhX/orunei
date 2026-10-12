import { Component } from 'react'
// Shows the error on screen instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="text-lg font-bold">Algo salió mal</h1>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600">{String(this.state.error)}</pre>
          <button onClick={() => { localStorage.clear(); location.reload() }} className="mt-4 rounded-lg bg-[#6d5cff] px-4 py-2 text-sm font-semibold text-white">Reiniciar</button>
        </div>
      </div>
    )
  }
}
