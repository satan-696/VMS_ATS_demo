import React from 'react'
import { QrCode, ClipboardEdit } from 'lucide-react'

function AadhaarChoice({ onChoice }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center space-y-8 sm:space-y-10">
      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-display font-bold uppercase tracking-[0.12em] text-white sm:text-4xl">
          Verification Mode
        </h2>
        <p className="text-xs font-mono uppercase tracking-[0.16em] text-slate-400 sm:text-sm">
          Select protocol for identity validation
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
        <button
          onClick={() => onChoice('qr')}
          className="glass-panel group relative flex min-h-[240px] flex-col items-center justify-center space-y-5 overflow-hidden border border-ats-accent/10 p-6 text-center transition-all hover:border-ats-accent/60 sm:min-h-[280px] sm:p-8"
        >
          <div className="absolute right-2 top-2 opacity-10 transition-opacity group-hover:opacity-30">
            <QrCode className="h-20 w-20 text-ats-accent sm:h-24 sm:w-24" />
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ats-accent/20 bg-ats-accent/5 transition-all group-hover:bg-ats-accent/20">
            <QrCode className="h-10 w-10 text-ats-accent" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold tracking-[0.08em] text-white sm:text-2xl">Aadhaar QR Scan</h3>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.15em] text-ats-accent/60 sm:text-xs">
              L1 high-speed protocol
            </p>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-ats-accent transition-all duration-500 group-hover:w-full" />
        </button>

        <button
          onClick={() => onChoice('manual')}
          className="glass-panel group relative flex min-h-[240px] flex-col items-center justify-center space-y-5 overflow-hidden border border-ats-accent/10 p-6 text-center transition-all hover:border-ats-accent/60 sm:min-h-[280px] sm:p-8"
        >
          <div className="absolute right-2 top-2 opacity-10 transition-opacity group-hover:opacity-30">
            <ClipboardEdit className="h-20 w-20 text-ats-accent sm:h-24 sm:w-24" />
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-ats-accent/20 bg-ats-accent/5 transition-all group-hover:bg-ats-accent/20">
            <ClipboardEdit className="h-10 w-10 text-ats-accent" />
          </div>
          <div>
            <h3 className="text-xl font-display font-bold tracking-[0.08em] text-white sm:text-2xl">Manual Entry</h3>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500 sm:text-xs">
              OTP secured validation
            </p>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-ats-accent transition-all duration-500 group-hover:w-full" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 rounded-full border border-ats-accent/5 bg-ats-accent/5 px-4 py-3 sm:px-7">
        <div className="h-2 w-2 rounded-full bg-ats-accent animate-pulse" />
        <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
          Secure biometric channel established with UIDAI 2.0
        </p>
      </div>
    </div>
  )
}

export default AadhaarChoice