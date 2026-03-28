import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'

function AadhaarManual({ onSendOTP }) {
  const [aadhaar, setAadhaar] = useState('')
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()

    if (aadhaar.length !== 12) {
      setError('Aadhaar must be 12 digits.')
      return
    }

    if (mobile.length !== 10) {
      setError('Mobile number must be 10 digits.')
      return
    }

    setLoading(true)
    setError('')
    onSendOTP(aadhaar, mobile)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center space-y-6 sm:space-y-8">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-display font-bold uppercase tracking-[0.12em] text-white sm:text-4xl">
          Manual Identity Entry
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
          Secure multi-factor authentication protocol
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel w-full space-y-6 border-ats-accent/10 p-5 sm:space-y-8 sm:p-8 lg:p-10">
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-ats-accent sm:text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-ats-accent" />
              Aadhaar Number
            </label>
            <input
              type="text"
              placeholder="000000000000"
              maxLength="12"
              required
              className="h-14 w-full rounded border border-ats-accent/20 bg-ats-bg/50 px-4 text-base tracking-[0.18em] text-ats-accent placeholder:text-ats-accent/20 focus:border-ats-accent focus:outline-none focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] sm:h-16 sm:px-6 sm:text-2xl sm:tracking-[0.28em]"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 sm:text-xs">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
              Mobile Number
            </label>
            <div className="flex h-14 sm:h-16">
              <div className="flex items-center rounded-l border border-r-0 border-ats-accent/20 bg-slate-900 px-3 font-mono text-sm text-slate-400 sm:px-6 sm:text-xl">
                +91
              </div>
              <input
                type="text"
                placeholder="0000000000"
                maxLength="10"
                required
                className="flex-1 rounded-r border border-ats-accent/20 bg-ats-bg/50 px-4 text-base tracking-[0.18em] text-white placeholder:text-slate-600 focus:border-ats-accent focus:outline-none sm:px-6 sm:text-2xl sm:tracking-[0.22em]"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded border border-ats-danger/30 bg-ats-danger-dim p-3 font-mono text-xs text-ats-danger">
            <span className="font-bold">[ERR]</span> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="gov-btn gov-btn-primary w-full py-4 text-base shadow-[0_4px_20px_rgba(34,211,238,0.2)] sm:py-5 sm:text-lg"
        >
          {loading ? (
            <span className="animate-pulse tracking-widest">TRANSMITTING...</span>
          ) : (
            <span className="flex items-center gap-3">REQUEST OTP ACCESS <ShieldCheck className="h-5 w-5" /></span>
          )}
        </button>

        <div className="flex flex-col items-center gap-2 pt-2 opacity-40">
          <div className="flex items-center gap-4">
            <div className="h-px w-10 bg-slate-700 sm:w-12" />
            <span className="text-[10px] font-mono uppercase tracking-widest">Encryption Active</span>
            <div className="h-px w-10 bg-slate-700 sm:w-12" />
          </div>
        </div>
      </form>
    </div>
  )
}

export default AadhaarManual