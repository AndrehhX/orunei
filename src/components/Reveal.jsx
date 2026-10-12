import { useEffect, useRef, useState } from 'react'
// Fades/slides children in when they enter the viewport (staggered with `delay` ms).
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect() } }, { threshold: 0.12 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ transitionDelay: `${on ? delay : 0}ms` }}
      className={`transition-[opacity,transform] duration-700 ease-smooth ${on ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}>{children}</div>
  )
}
