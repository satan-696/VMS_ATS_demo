import React, { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'

function SessionGuard({ onReset, timeout = 180000, warning = 30000 }) {
  const [timeLeft, setTimeLeft] = useState(timeout)
  const [showWarning, setShowWarning] = useState(false)

  const resetTimer = useCallback(() => {
    setTimeLeft(timeout)
    setShowWarning(false)
  }, [timeout])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer))
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          onReset()
          return 0
        }
        if (prev <= warning) {
          setShowWarning(true)
        }
        return prev - 1000
      })
    }, 1000)

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      clearInterval(interval)
    }
  }, [resetTimer, onReset, warning])

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 z-[999] bg-ats-bg/95 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
      <div className="glass-panel max-w-lg w-full p-12 text-center space-y-10 border-ats-amber/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-ats-amber/20">
           <div className="h-full bg-ats-amber animate-[ping_2s_infinite] origin-left"></div>
        </div>
        
        <div className="flex justify-center">
           <div className="bg-ats-amber/10 p-8 rounded-full border border-ats-amber/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
             <Clock className="w-16 h-16 text-ats-amber animate-pulse" />
           </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-display font-bold text-white tracking-widest uppercase italic">Presence Check</h2>
          <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Automatic session termination in:</p>
          <p className="text-7xl font-mono font-bold text-ats-danger tracking-tighter drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">{Math.ceil(timeLeft / 1000)}s</p>
        </div>
        <div className="flex flex-col gap-4 relative z-10">
          <button 
            onClick={resetTimer}
            className="gov-btn gov-btn-primary py-6 text-xl shadow-[0_0_25px_rgba(34,211,238,0.2)]"
          >
            MAINTAIN ACTIVE SESSION
          </button>
          <button 
            onClick={onReset}
            className="w-full py-4 text-ats-accent/50 font-mono text-[10px] uppercase tracking-[0.3em] hover:text-ats-accent transition-colors"
          >
            &gt; MANUAL LOGOUT
          </button>
        </div>

        <div className="pt-4 opacity-20">
           <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest leading-loose">
             SECURITY_PROTOCOL: IDLE_TIMEOUT_INIT <br/>
             SURVEILLANCE_STATE: ACTIVE
           </p>
        </div>
      </div>
    </div>
  )
}

export default SessionGuard
