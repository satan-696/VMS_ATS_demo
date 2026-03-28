import React from 'react'

function Welcome({ onNext }) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center space-y-8 text-center sm:space-y-10">
      <div className="glass-panel relative w-full overflow-hidden rounded-lg p-6 sm:p-10 lg:p-12">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-ats-accent to-transparent opacity-50" />

        <div className="relative z-10 space-y-5 sm:space-y-6">
          <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
            <div className="absolute inset-0 rounded-full bg-ats-accent/20 blur-xl animate-pulse" />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Emblem of India"
              className="relative z-10 w-full brightness-0 invert opacity-90"
            />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-display font-bold tracking-[0.12em] text-white sm:text-4xl lg:text-5xl">
              SECURE ENTRY
            </h2>
            <div className="mx-auto h-0.5 w-20 bg-ats-accent sm:w-24" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-mono uppercase tracking-[0.12em] text-ats-accent sm:text-base lg:text-lg">
              Biometric Registration Protocol 0.8
            </p>
            <p className="text-sm text-slate-400 opacity-80 sm:text-base">
              Please complete visitor verification before entry.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className="gov-btn gov-btn-primary group relative w-full max-w-xl overflow-hidden py-5 text-lg font-display tracking-[0.18em] sm:py-6 sm:text-xl"
      >
        <span className="relative z-10">INITIATE CLEARANCE</span>
        <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      <p className="max-w-xl text-[10px] uppercase tracking-widest text-slate-500 sm:text-xs">
        Identity verification uses a secure UIDAI gateway. All sessions are logged and monitored.
      </p>
    </div>
  )
}

export default Welcome