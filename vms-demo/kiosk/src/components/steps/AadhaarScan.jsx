import React, { useState } from 'react'
import { QrCode, Scan } from 'lucide-react'

function AadhaarScan({ onScan, onFallback }) {
  const [scanning, setScanning] = useState(false)

  const handleSimulateScan = () => {
    setScanning(true)
    setTimeout(() => {
      onScan('999999990001')
    }, 2000)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center space-y-6 text-center sm:space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold uppercase tracking-[0.12em] text-white sm:text-4xl">
          Aadhaar QR Scan
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
          Position code within optical sensor range
        </p>
      </div>

      <div className="glass-panel relative aspect-square w-full max-w-[420px] overflow-hidden rounded border border-ats-accent/20 p-3 sm:p-4">
        <div className="absolute left-3 top-3 h-10 w-10 rounded-tl border-l-2 border-t-2 border-ats-accent sm:h-12 sm:w-12" />
        <div className="absolute right-3 top-3 h-10 w-10 rounded-tr border-r-2 border-t-2 border-ats-accent sm:h-12 sm:w-12" />
        <div className="absolute bottom-3 left-3 h-10 w-10 rounded-bl border-b-2 border-l-2 border-ats-accent sm:h-12 sm:w-12" />
        <div className="absolute bottom-3 right-3 h-10 w-10 rounded-br border-b-2 border-r-2 border-ats-accent sm:h-12 sm:w-12" />

        <div
          className={`absolute left-0 right-0 z-20 h-0.5 bg-ats-accent/50 shadow-[0_0_15px_rgba(34,211,238,0.8)] ${scanning ? 'animate-scan-fast' : 'animate-pulse'}`}
          style={{ top: '20%' }}
        />

        <div className="flex h-full w-full items-center justify-center">
          {scanning ? (
            <div className="flex flex-col items-center space-y-4 animate-pulse">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ats-accent/30 bg-ats-accent/10 sm:h-24 sm:w-24">
                <Scan className="h-10 w-10 text-ats-accent sm:h-12 sm:w-12" />
              </div>
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-ats-accent sm:text-xs">Processing Data...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 opacity-20">
              <QrCode className="h-24 w-24 text-ats-accent sm:h-32 sm:w-32" />
              <p className="text-[10px] font-mono uppercase tracking-widest sm:text-xs">Scanner Standby</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full space-y-4">
        <button
          onClick={handleSimulateScan}
          disabled={scanning}
          className="gov-btn gov-btn-primary w-full py-4 text-base shadow-[0_0_20px_rgba(34,211,238,0.2)] sm:py-5 sm:text-lg"
        >
          {scanning ? (
            <span className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ats-bg border-t-transparent" />
              SCANNING...
            </span>
          ) : (
            'START SECURE SCAN'
          )}
        </button>

        <button
          onClick={onFallback}
          className="w-full py-1 text-xs font-mono uppercase tracking-widest text-ats-accent/60 transition-colors hover:text-ats-accent"
        >
          Switch to manual entry protocol
        </button>
      </div>

      <p className="max-w-2xl px-2 text-center text-[10px] font-mono uppercase tracking-widest text-slate-500 sm:px-6 sm:text-xs">
        Ensure Aadhaar QR is visible. Demographics are extracted from the signed payload.
      </p>
    </div>
  )
}

export default AadhaarScan