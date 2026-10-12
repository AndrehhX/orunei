import { useEffect, useRef, useState } from 'react'

const spring = 'transform .45s cubic-bezier(.34,1.56,.64,1)'

function Eye({ cx, cy, t, open }) {
  const d = Math.hypot(t.x - cx, t.y - cy) || 1
  const k = Math.min(1, d / 60) * 3.6
  return (
    <g style={{ transform: `scaleY(${open ? 1 : 0.1})`, transformOrigin: `${cx}px ${cy}px`, transition: spring }}>
      <circle cx={cx} cy={cy} r="9" fill="#fff" />
      <circle cx={cx} cy={cy} r="4.6" fill="#16162a"
        style={{ transform: `translate(${((t.x - cx) / d) * k}px, ${((t.y - cy) / d) * k}px)`, transition: 'transform .3s ease-out' }} />
    </g>
  )
}

const Mouth = ({ x, y, w = 16, flat }) => (
  <path d={`M${x} ${y} q${w / 2} ${flat ? 0 : 7} ${w} 0`} stroke="#16162a" strokeWidth="2.6" fill="none" strokeLinecap="round" style={{ transition: 'all .3s' }} />
)
const Char = ({ delay, tiltStyle, children }) => (
  <g className="animate-drop" style={{ animationDelay: `${delay}ms` }}>
    <g className="animate-bob" style={{ animationDelay: `${delay}ms` }}><g style={tiltStyle}>{children}</g></g>
  </g>
)

// mode: idle (follows mouse) | email (looks down at the form) | pass (looks away, eyes shut) | peek (one cheeky eye open)
export default function Mascots({ mode, emailLen = 0 }) {
  const ref = useRef(null)
  const [m, setM] = useState({ x: 160, y: 110 })
  useEffect(() => {
    const f = (e) => {
      const r = ref.current.getBoundingClientRect()
      setM({ x: ((e.clientX - r.left) / r.width) * 320, y: ((e.clientY - r.top) / r.height) * 230 })
    }
    window.addEventListener('mousemove', f)
    return () => window.removeEventListener('mousemove', f)
  }, [])

  const away = mode === 'pass' || mode === 'peek'
  const t = mode === 'email' ? { x: 110 + Math.min(emailLen, 26) * 4.5, y: 300 } : away ? { x: -40, y: -80 } : m
  const peekT = { x: 330, y: 300 }
  const tilt = (deg, y = 0) => ({ transform: away ? `rotate(${deg}deg) translateY(${y}px)` : 'none', transformBox: 'fill-box', transformOrigin: '50% 100%', transition: spring })
  return (
    <svg ref={ref} viewBox="0 0 320 230" className="mx-auto block w-full max-w-[340px] select-none" aria-hidden>
      <ellipse cx="160" cy="214" rx="140" ry="7" fill="#6d5cff" opacity=".12" />
      <Char delay={0} tiltStyle={tilt(-4)}>
        <rect x="70" y="30" width="100" height="184" rx="24" fill="#6d5cff" />
        <Eye cx={103} cy={82} t={mode === 'peek' ? peekT : t} open={mode !== 'pass'} />
        <Eye cx={139} cy={82} t={mode === 'peek' ? peekT : t} open={mode !== 'pass'} />
        <Mouth flat={away} x={112} y={112} />
      </Char>
      <Char delay={150} tiltStyle={tilt(5)}>
        <rect x="165" y="92" width="72" height="122" rx="18" fill="#1f1d36" />
        <Eye cx={188} cy={128} t={t} open={!away} /><Eye cx={214} cy={128} t={t} open={!away} />
        <Mouth flat={away} x={193} y={152} w={14} />
      </Char>
      <Char delay={300} tiltStyle={tilt(4, 2)}>
        <rect x="228" y="134" width="82" height="80" rx="40" fill="#ffc857" />
        <Eye cx={253} cy={168} t={t} open={!away} /><Eye cx={285} cy={168} t={t} open={!away} />
        <Mouth flat={away} x={261} y={190} w={14} />
      </Char>
      <Char delay={450} tiltStyle={tilt(-3, 4)}>
        <path d="M8 214 a62 62 0 0 1 124 0 Z" fill="#f4a6c1" />
        <Eye cx={50} cy={184} t={t} open={!away} /><Eye cx={90} cy={184} t={t} open={!away} />
        <circle cx="34" cy="199" r="6" fill="#ff7aa2" opacity={away ? 0.7 : 0.25} style={{ transition: 'opacity .4s' }} />
        <circle cx="106" cy="199" r="6" fill="#ff7aa2" opacity={away ? 0.7 : 0.25} style={{ transition: 'opacity .4s' }} />
        <Mouth flat={away} x={62} y={200} w={16} />
      </Char>
    </svg>
  )
}
