import React, { useEffect, useRef, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

function SessionGuard({ onReset, timeoutSeconds = 180 }) {
  const [remaining, setRemaining] = useState(timeoutSeconds)
  const [showWarning, setShowWarning] = useState(false)
  const timerRef = useRef(null)
  const lastActivity = useRef(Date.now())

  const resetTimer = () => {
    lastActivity.current = Date.now()
    setShowWarning(false)
  }

  useEffect(() => {
    const events = ['click', 'keydown', 'touchstart', 'mousemove']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))

    timerRef.current = setInterval(() => {
      const idle = Math.floor((Date.now() - lastActivity.current) / 1000)
      const left = timeoutSeconds - idle
      setRemaining(Math.max(0, left))
      setShowWarning(left <= 30 && left > 0)
      if (left <= 0) {
        clearInterval(timerRef.current)
        onReset()
      }
    }, 1000)

    return () => {
      clearInterval(timerRef.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [onReset, timeoutSeconds])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[200] bg-gov-primary/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full space-y-8 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-start">
          <div className="bg-yellow-50 p-4 rounded-2xl">
            <AlertTriangle className="w-10 h-10 text-yellow-600" />
          </div>
          <button onClick={resetTimer} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-2xl font-extrabold text-gov-primary tracking-tight">Session Expiring</h3>
          <p className="text-gov-text-muted font-medium">
            Your session will auto-reset due to inactivity.
            <br /><span className="font-bold text-gov-primary italic">सत्र निष्क्रियता के कारण स्वतः रीसेट होगा।</span>
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-4 border-gov-accent flex items-center justify-center shrink-0">
            <span className="text-3xl font-extrabold font-mono text-gov-accent">{remaining}</span>
          </div>
          <p className="text-sm text-slate-500 font-bold leading-relaxed">
            Tap anywhere or press the button below to continue your session.
          </p>
        </div>

        <button 
          onClick={resetTimer}
          className="gov-button-primary w-full py-5 text-lg tracking-wide"
        >
          CONTINUE SESSION
        </button>
      </div>
    </div>
  )
}

export default SessionGuard
