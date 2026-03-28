import React, { useState, useEffect } from 'react'

function OTPVerify({ mobileHint, onVerify, onResend }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [timer, setTimer] = useState(45)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  const handleChange = (index, value) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) return

    setLoading(true)
    setError('')
    const success = await onVerify(code)

    if (!success) {
      setLoading(false)
      setError('Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0').focus()
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center space-y-6 sm:space-y-8">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-display font-bold uppercase tracking-[0.12em] text-white sm:text-4xl">
          Access Token Required
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
          OTP sent to mobile ending in <span className="font-bold tracking-widest text-ats-accent">{mobileHint}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel w-full space-y-8 border-ats-accent/10 p-5 sm:p-8 md:p-10">
        <div className="grid grid-cols-3 gap-3 sm:flex sm:justify-between sm:gap-4">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength="1"
              autoFocus={i === 0}
              className="h-14 w-full rounded border border-ats-accent/20 bg-ats-bg/50 text-center font-mono text-2xl font-bold text-ats-accent transition-all focus:border-ats-accent focus:outline-none focus:shadow-[0_0_20px_rgba(34,211,238,0.3)] sm:h-20 sm:w-14 sm:text-4xl md:w-16"
              value={digit}
              onChange={(e) => handleChange(i, e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => handleKeyDown(i, e)}
            />
          ))}
        </div>

        {error && (
          <div className="rounded border border-ats-danger/30 bg-ats-danger-dim p-3 text-center font-mono text-xs uppercase tracking-wider text-ats-danger">
            [SECURITY ALERT] {error}
          </div>
        )}

        <div className="text-center">
          {timer > 0 ? (
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 sm:text-xs">
              Request new token in <span className="font-bold text-white">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTimer(45)
                onResend()
              }}
              className="text-xs font-mono uppercase tracking-widest text-ats-accent hover:underline"
            >
              RETRANSMIT TOKEN
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6}
          className="gov-btn gov-btn-primary w-full py-4 text-base shadow-[0_0_25px_rgba(34,211,238,0.2)] transition-all disabled:grayscale disabled:opacity-30 sm:py-5 sm:text-lg"
        >
          {loading ? (
            <span className="animate-pulse uppercase tracking-widest">Validating Hash...</span>
          ) : (
            <span className="uppercase tracking-widest">Authorize Entry</span>
          )}
        </button>

        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-slate-700 sm:text-xs">
          Demo OTP: <span className="text-slate-500">123456</span>
        </p>
      </form>
    </div>
  )
}

export default OTPVerify