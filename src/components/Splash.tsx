import { useEffect, useState } from 'react'

/**
 * A brief book-cover splash shown while the app loads, then auto-dismissed.
 * It is always dark — it is the book jacket — regardless of the app theme.
 */
export default function Splash() {
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 2000)
    const t2 = setTimeout(() => setGone(true), 2600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (gone) return null

  return (
    <div
      className={'splash' + (leaving ? ' leaving' : '')}
      aria-hidden="true"
    >
      <div className="splash-series">
        THE <b>DON'T SCREW UP</b> SERIES
      </div>
      <div className="splash-pre">DON'T SCREW UP YOUR</div>
      <div className="splash-title">
        <span className="data">DATA</span>
        <span className="gov">GOVERNANCE.</span>
      </div>
      <div className="splash-sub">
        A CONTEXT-DRIVEN FRAMEWORK FOR THE <b>NEXT DECADE.</b>
      </div>
      <img className="splash-stack" src="/icon-512.png" alt="" />
      <div className="splash-foundation">CONTEXT IS THE FOUNDATION.</div>
      <div className="splash-author">HARRO M. WIERSMA</div>
      <div className="splash-app">
        Monday Morning Companion — loading…
      </div>
    </div>
  )
}
