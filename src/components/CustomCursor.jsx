import { useEffect, useRef, useState } from 'react'
import { cursorState } from '../ui/cursor.js'

const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, [role="button"], label'

function readCursorCapability() {
  return cursorState({
    pointer: window.matchMedia('(pointer: fine)').matches ? 'fine' : 'coarse',
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  })
}

export default function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const frameRef = useRef(0)
  const [capability, setCapability] = useState({ enabled: false })
  const [interactive, setInteractive] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const pointerQuery = window.matchMedia('(pointer: fine)')
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setCapability(readCursorCapability())
    sync()
    pointerQuery.addEventListener?.('change', sync)
    motionQuery.addEventListener?.('change', sync)
    return () => {
      pointerQuery.removeEventListener?.('change', sync)
      motionQuery.removeEventListener?.('change', sync)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (!capability.enabled) {
      root.classList.remove('has-custom-cursor')
      return undefined
    }

    root.classList.add('has-custom-cursor')
    const move = (event) => {
      const target = event.target instanceof Element ? event.target.closest(INTERACTIVE_SELECTOR) : null
      setInteractive((current) => current === Boolean(target) ? current : Boolean(target))
      const x = event.clientX
      const y = event.clientY
      cancelAnimationFrame(frameRef.current)
      frameRef.current = requestAnimationFrame(() => {
        if (dotRef.current) dotRef.current.style.transform = `translate3d(${x - 4}px, ${y - 4}px, 0)`
        if (ringRef.current) ringRef.current.style.transform = `translate3d(${x - 18}px, ${y - 18}px, 0)`
      })
    }
    const leave = () => root.classList.add('cursor-away')
    const enter = () => root.classList.remove('cursor-away')
    const down = () => setPressed(true)
    const up = () => setPressed(false)

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerleave', leave)
    window.addEventListener('pointerenter', enter)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    return () => {
      cancelAnimationFrame(frameRef.current)
      root.classList.remove('has-custom-cursor', 'cursor-away')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', leave)
      window.removeEventListener('pointerenter', enter)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
    }
  }, [capability.enabled])

  if (!capability.enabled) return null
  return <div aria-hidden="true" className={`custom-cursor ${interactive ? 'is-interactive' : ''} ${pressed ? 'is-pressed' : ''}`}>
    <span ref={ringRef} className="custom-cursor-ring" />
    <span ref={dotRef} className="custom-cursor-dot" />
  </div>
}
