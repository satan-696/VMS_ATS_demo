import React, { useState, useEffect } from 'react'
import Welcome from './components/steps/Welcome'
import AadhaarChoice from './components/steps/AadhaarChoice'
import AadhaarScan from './components/steps/AadhaarScan'
import AadhaarManual from './components/steps/AadhaarManual'
import OTPVerify from './components/steps/OTPVerify'
import IdentityConfirm from './components/steps/IdentityConfirm'
import FaceCapture from './components/steps/FaceCapture'
import Processing from './components/steps/Processing'
import Result from './components/steps/Result'
import SessionGuard from './components/SessionGuard'
import * as api from './services/api'

const STEPS = {
  WELCOME: 'WELCOME',
  CHOICE: 'CHOICE',
  SCAN: 'SCAN',
  MANUAL: 'MANUAL',
  OTP: 'OTP',
  CONFIRM: 'CONFIRM',
  FACE: 'FACE',
  PROCESSING: 'PROCESSING',
  RESULT: 'RESULT'
}

const STEP_ORDER = [
  STEPS.WELCOME,
  STEPS.CHOICE,
  STEPS.SCAN,
  STEPS.MANUAL,
  STEPS.OTP,
  STEPS.CONFIRM,
  STEPS.FACE,
  STEPS.PROCESSING,
  STEPS.RESULT
]

function App() {
  const [step, setStep] = useState(STEPS.WELCOME)
  const [aadhaar, setAadhaar] = useState('')
  const [mobile, setMobile] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [isMock, setIsMock] = useState(true)
  const [visitor, setVisitor] = useState(null)
  const [mobileHint, setMobileHint] = useState('')
  const [visitResult, setVisitResult] = useState(null)

  useEffect(() => {
    // Kiosk UX: disable middle-click autoscroll indicator (crosshair icon)
    const preventMiddleClickAutoScroll = (event) => {
      if (event.button === 1) event.preventDefault()
    }
    window.addEventListener('mousedown', preventMiddleClickAutoScroll, { passive: false })
    return () => window.removeEventListener('mousedown', preventMiddleClickAutoScroll)
  }, [])

  const resetAll = () => {
    setStep(STEPS.WELCOME)
    setAadhaar('')
    setMobile('')
    setReferenceId('')
    setIsMock(true)
    setVisitor(null)
    setMobileHint('')
    setVisitResult(null)
  }

  const handleStart = () => setStep(STEPS.CHOICE)

  const handleChoice = (type) => {
    setStep(type === 'qr' ? STEPS.SCAN : STEPS.MANUAL)
  }

  const handleAadhaarSubmit = async (num, mobileNum) => {
    setAadhaar(num)
    if (mobileNum) setMobile(mobileNum)
    try {
      const res = await api.sendOTP(num)
      setReferenceId(res.data.referenceId)
      setIsMock(res.data._isMock)
      setMobileHint(res.data.mobileHint || '****')
      setStep(STEPS.OTP)
    } catch (err) {
      alert('Error sending OTP. Please try again.')
    }
  }

  const handleScan = async (num) => {
    setAadhaar(num)
    setMobile('0000000000')
    try {
      const res = await api.verifyOTP(num, '123456', 'MOCK-SCAN')
      setVisitor({
        ...res.data,
        mobile: '0000000000'
      })
      setIsMock(res.data._isMock)
      setStep(STEPS.CONFIRM)
    } catch (err) {
      alert('QR scan failed. Please use manual entry.')
    }
  }

  const handleVerifyOTP = async (otp) => {
    try {
      const res = await api.verifyOTP(aadhaar, otp, referenceId)
      
      // Store visitor data including the real Aadhaar photo
      setVisitor({
        ...res.data,
        mobile: mobile,
        reference_photo_base64: res.data.photo // Sandbox returns 'photo'
      })
      setIsMock(res.data._isMock)
      setStep(STEPS.CONFIRM)
      return true
    } catch (err) {
      return false
    }
  }

  const handleConfirmDetails = (details) => {
    setVisitor((prev) => ({ ...prev, ...details }))
    setStep(STEPS.FACE)
  }

  const handleFaceCapture = (photo) => {
    setVisitor((prev) => ({ ...prev, live_photo_base64: photo }))
    setStep(STEPS.PROCESSING)
  }

  const handleProcessingComplete = async () => {
    try {
      const res = await api.registerVisit({
        ...visitor,
        aadhaar_masked: visitor.aadhaarMasked || `XXXX-XXXX-${aadhaar.slice(-4)}`,
        is_mock_verification: isMock
      })
      
      // Inject the current visitor data into the result so Result.jsx can print the pass
      const completeResult = {
        ...res.data,
        visitor: visitor 
      }
      
      setVisitResult(completeResult)
      setStep(STEPS.RESULT)
    } catch (err) {
      alert('Registration failed. Please see the guard.')
    }
  }

  const progress = (STEP_ORDER.indexOf(step) / (STEP_ORDER.length - 1)) * 100

  return (
    <div className="relative flex min-h-dvh flex-col bg-ats-bg font-sans text-slate-200 select-none">
      <SessionGuard onReset={resetAll} />

      <header className="z-10 border-b border-ats-accent/20 bg-ats-panel/95 px-4 py-3 shadow-[0_0_20px_rgba(0,0,0,0.5)] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <div className="relative shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="GOI"
                className="h-10 w-10 brightness-0 invert opacity-80 sm:h-12 sm:w-12"
              />
              <div className="absolute -inset-1 rounded-full bg-ats-accent/10 blur-sm" />
            </div>
            <div className="border-l border-ats-accent/20 pl-3 sm:pl-5">
              <h1 className="truncate font-display text-base font-bold tracking-[0.14em] text-ats-accent sm:text-lg lg:text-xl">
                ATS COMMAND CENTER
              </h1>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400 sm:text-[11px]">
                Security protocols active • Unit 7-B
              </p>
            </div>
          </div>

          <div className="text-left font-mono sm:text-right">
            <div className="text-[11px] font-bold text-ats-accent animate-pulse">? SYSTEM LIVE</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              {new Date().toLocaleTimeString('en-IN')}
            </div>
          </div>
        </div>
      </header>

      {step !== STEPS.WELCOME && step !== STEPS.RESULT && (
        <div className="h-1 w-full overflow-hidden bg-slate-900">
          <div
            className="h-full bg-ats-accent shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto flex min-h-full w-full max-w-7xl items-center justify-center">
          {step === STEPS.WELCOME && <Welcome onNext={handleStart} />}
          {step === STEPS.CHOICE && <AadhaarChoice onChoice={handleChoice} />}
          {step === STEPS.SCAN && <AadhaarScan onScan={handleScan} onFallback={() => setStep(STEPS.MANUAL)} />}
          {step === STEPS.MANUAL && <AadhaarManual onSendOTP={handleAadhaarSubmit} />}
          {step === STEPS.OTP && (
            <OTPVerify
              mobileHint={mobileHint}
              onVerify={handleVerifyOTP}
              onResend={() => handleAadhaarSubmit(aadhaar)}
            />
          )}
          {step === STEPS.CONFIRM && (
            <IdentityConfirm
              visitor={visitor}
              onConfirm={handleConfirmDetails}
              onBack={() => setStep(STEPS.CHOICE)}
            />
          )}
          {step === STEPS.FACE && <FaceCapture onCapture={handleFaceCapture} onSkip={() => handleFaceCapture(null)} />}
          {step === STEPS.PROCESSING && <Processing onComplete={handleProcessingComplete} isMock={isMock} />}
          {step === STEPS.RESULT && <Result result={visitResult} onReset={resetAll} />}
        </div>
      </main>

      <footer className="border-t border-ats-accent/10 bg-slate-950/80 px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="opacity-40">Encrypted terminal 0x4F2A</div>
          <div className="flex items-center gap-4 sm:gap-8">
            <div>Uptime: 99.9%</div>
            <div className="text-ats-accent/50">ATS Internal Network</div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
