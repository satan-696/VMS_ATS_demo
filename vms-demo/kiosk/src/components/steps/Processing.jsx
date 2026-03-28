import React, { useState, useEffect } from 'react'
import { CheckCircle2, CircleDashed } from 'lucide-react'

function Processing({ onComplete, isMock = true }) {
  const [steps, setSteps] = useState([
    { id: 1, label: 'Aadhaar verified', status: 'done' },
    { id: 2, label: 'Photo captured', status: 'done' },
    { id: 3, label: 'Running face verification...', status: 'loading' },
    { id: 4, label: 'Checking security database...', status: 'waiting' },
    { id: 5, label: 'Calculating risk assessment...', status: 'waiting' },
    { id: 6, label: 'Generating visitor pass...', status: 'waiting' }
  ])

  useEffect(() => {
    const sequence = async () => {
      for (let i = 2; i < steps.length; i += 1) {
        await new Promise((r) => setTimeout(r, 1500))
        setSteps((prev) =>
          prev.map((s, idx) => {
            if (idx === i) return { ...s, status: 'done' }
            if (idx === i + 1) return { ...s, status: 'loading' }
            return s
          })
        )
      }
      await new Promise((r) => setTimeout(r, 1000))
      onComplete()
    }

    sequence()
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center space-y-8">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-display font-bold uppercase tracking-[0.12em] text-white sm:text-4xl">System Review</h2>
        
        {/* Verification Status Banner */}
        <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest shadow-lg sm:text-xs">
          {isMock ? (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="text-amber-500">⚠ DEMO MODE — Simulated verification</span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 animate-pulse rounded-full bg-ats-success" />
              <span className="text-ats-success">🔴 LIVE — Connected to UIDAI via Signzy</span>
            </>
          )}
        </div>

        <p className="mt-4 text-[10px] font-mono uppercase tracking-widest text-slate-500 sm:text-xs">
          Executing multi-layered security protocols
        </p>
      </div>

      <div className="glass-panel relative w-full space-y-3 border-ats-accent/20 p-4 sm:space-y-4 sm:p-6 lg:p-8">
        <div className="absolute left-0 top-0 h-0.5 w-full bg-ats-accent/10" />

        {steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-2 rounded border border-transparent p-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 sm:items-center sm:gap-5">
              {step.status === 'done' ? (
                <div className="rounded-full border border-ats-success/30 bg-ats-success/10 p-1">
                  <CheckCircle2 className="h-5 w-5 text-ats-success sm:h-6 sm:w-6" />
                </div>
              ) : step.status === 'loading' ? (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-ats-accent/20 blur-sm animate-pulse" />
                  <CircleDashed className="relative z-10 h-6 w-6 animate-spin text-ats-accent sm:h-7 sm:w-7" />
                </div>
              ) : (
                <div className="h-6 w-6 rounded-full border border-slate-800 bg-slate-900 sm:h-7 sm:w-7" />
              )}

              <span
                className={`font-mono text-sm sm:text-base ${
                  step.status === 'done'
                    ? 'text-slate-200'
                    : step.status === 'loading'
                      ? 'animate-pulse text-ats-accent'
                      : 'text-slate-700'
                }`}
              >
                {step.status === 'loading' ? `[RUNNING] ${step.label}` : step.label}
              </span>
            </div>

            <div className="text-[10px] font-mono font-bold tracking-[0.16em] sm:text-xs">
              {step.status === 'done' ? (
                <span className="rounded border border-ats-success/20 bg-ats-success/5 px-2 py-1 text-ats-success">OK_SUCCESS</span>
              ) : step.status === 'loading' ? (
                <span className="rounded border border-ats-accent/20 px-2 py-1 text-ats-accent animate-pulse">IN_PROGRESS</span>
              ) : (
                <span className="rounded border border-slate-900 px-2 py-1 text-slate-700">QUEUED</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative h-0.5 w-40 overflow-hidden bg-slate-900 sm:w-48">
          <div className="absolute inset-y-0 left-0 w-1/3 animate-[slide_2s_infinite] bg-ats-accent" />
        </div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 sm:text-xs">
          Identity verification sequence active
        </p>
      </div>
    </div>
  )
}

export default Processing