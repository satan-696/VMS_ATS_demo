import React, { useState, useEffect, useCallback } from 'react'
import Welcome from './components/steps/Welcome'
import Options from './components/steps/Options'
import AadhaarOVSE from './components/steps/AadhaarOVSE'
import ManualDocument from './components/steps/ManualDocument'
import DigiLocker from './components/steps/DigiLocker'
import AadhaarOTP from './components/steps/AadhaarOTP'
import IdentityConfirm from './components/steps/IdentityConfirm'
import FaceCapture from './components/steps/FaceCapture'
import Processing from './components/steps/Processing'
import Result from './components/steps/Result'
import SessionGuard from './components/SessionGuard'
import * as api from './services/api'
import { Shield, Clock, AlertCircle } from 'lucide-react'

const STEPS = {
  WELCOME: 'WELCOME',
  OPTIONS: 'OPTIONS',
  OVSE: 'OVSE',
  MANUAL: 'MANUAL',
  CONFIRM: 'CONFIRM',
  FACE: 'FACE',
  DIGILOCKER: 'DIGILOCKER', 
  AADHAAR_OTP: 'AADHAAR_OTP',
  PROCESSING: 'PROCESSING',
  RESULT: 'RESULT'
}

const SESSION_TIMEOUT_SEC = 180 // 3 minutes

function App() {
  const [step, setStep] = useState(STEPS.WELCOME)
  const [visitor, setVisitor] = useState(null)
  const [visitResult, setVisitResult] = useState(null)
  const [verificationType, setVerificationType] = useState('aadhaar_ovse')
  const [demoVisitor, setDemoVisitor] = useState(1) // Controlled by ?demo=true hidden UI
  const [showDemoUI, setShowDemoUI] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Check for demo mode in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === 'true') {
      setShowDemoUI(true)
    }

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const resetAll = useCallback(() => {
    setStep(STEPS.WELCOME)
    setVisitor(null)
    setVisitResult(null)
    setVerificationType('aadhaar_ovse')
  }, [])

  const handleStart = () => setStep(STEPS.OPTIONS)

  const handleOptionSelect = (type) => {
    setVerificationType(type)
    if (type === 'aadhaar_ovse') setStep(STEPS.OVSE)
    else if (type === 'aadhaar_digilocker') setStep(STEPS.DIGILOCKER)
    else setStep(STEPS.MANUAL)
  }

  const handleOVSEComplete = (data) => {
    setVisitor({
      ...data,
      name: data.full_name || data.name,
      reference_photo_base64: data.photo
    })
    setStep(STEPS.CONFIRM)
  }

  const handleManualSubmit = (data) => {
    // data is a FormData object with document details, 
    // OR a JSON object for manual_otp path
    if (data.verification_type === 'aadhaar_manual_otp') {
      setVisitor(data)
      setStep(STEPS.AADHAAR_OTP)
      return
    }
    setVisitor(data) 
    setStep(STEPS.FACE)
  }

  const handleConfirmDetails = (details) => {
    setVisitor((prev) => ({ ...prev, ...details }))
    setStep(STEPS.FACE)
  }

  const handleFaceCapture = (photo) => {
    if (verificationType === 'manual_document') {
      // visitor is a FormData object here
      visitor.append('live_photo_base64', photo)
      setVisitor(visitor)
    } else {
      setVisitor((prev) => ({ ...prev, live_photo_base64: photo }))
    }
    setStep(STEPS.PROCESSING)
  }

  const handleFinalRegistration = async () => {
    try {
      let res
      if (verificationType === 'aadhaar_ovse') {
        res = await api.registerVisit({
          ...visitor,
          verification_type: 'aadhaar_ovse',
          is_mock_verification: true // Demo mode
        })
      } else {
        // Manual document registration
        res = await api.registerManualDocument(visitor)
      }
      setVisitResult(res.data)
      setStep(STEPS.RESULT)
    } catch (err) {
      console.error("Registration error:", err)
      alert('Registration failed. Please contact reception.')
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-gov-bg font-sans text-gov-text select-none overflow-hidden">
      <SessionGuard onReset={resetAll} timeoutSeconds={SESSION_TIMEOUT_SEC} />

      {/* Official Header */}
      <header className="z-20 bg-gov-primary text-white shadow-gov-lg border-b-4 border-gov-accent">
        <div className="gov-container flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="Emblem of India"
                className="h-14 w-auto"
              />
            </div>
            <div className="border-l border-white/20 pl-6">
              <h1 className="text-2xl font-bold tracking-tight uppercase leading-tight">
                Visitor Management System
              </h1>
              <p className="text-xs font-semibold text-blue-200 tracking-[0.2em] uppercase">
                Government of India • Ministry of Home Affairs
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-right font-medium">
             <div className="flex flex-col">
                <span className="text-[10px] text-blue-200 uppercase tracking-widest">Local Session Time</span>
                <span className="text-xl font-bold font-mono tracking-tighter">
                  {currentTime.toLocaleTimeString('en-IN', { hour12: true })}
                </span>
             </div>
             <div className="h-10 w-px bg-white/10" />
             <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-gov-accent" />
                <span className="text-xs font-bold uppercase tracking-widest">Secured Node</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-12 px-6">
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {step === STEPS.WELCOME && <Welcome onNext={handleStart} />}
          {step === STEPS.OPTIONS && <Options onSelect={handleOptionSelect} onBack={() => setStep(STEPS.WELCOME)} />}
          {step === STEPS.OVSE && (
            <AadhaarOVSE 
              demoVisitor={demoVisitor} 
              onComplete={handleOVSEComplete} 
              onBack={() => setStep(STEPS.OPTIONS)} 
            />
          )}
          {step === STEPS.MANUAL && (
            <ManualDocument 
              onComplete={handleManualSubmit} 
              onBack={() => setStep(STEPS.OPTIONS)} 
            />
          )}
          {step === STEPS.DIGILOCKER && (
            <DigiLocker 
              onComplete={handleOVSEComplete} 
              onBack={() => setStep(STEPS.OPTIONS)} 
            />
          )}
          {step === STEPS.AADHAAR_OTP && (
            <AadhaarOTP 
              visitId={visitor?.visit_id}
              maskedAadhaar={visitor?.masked_aadhaar}
              onComplete={(res) => {
                setVisitResult(res)
                setStep(STEPS.RESULT)
              }} 
              onBack={() => setStep(STEPS.MANUAL)} 
            />
          )}
          {step === STEPS.CONFIRM && (
            <IdentityConfirm 
              visitor={visitor} 
              onConfirm={handleConfirmDetails} 
              onBack={() => setStep(STEPS.OPTIONS)} 
            />
          )}
          {step === STEPS.FACE && (
            <FaceCapture 
              onCapture={handleFaceCapture} 
              onSkip={() => handleFaceCapture(null)} 
            />
          )}
          {step === STEPS.PROCESSING && (
            <Processing 
              visitor={visitor}
              onComplete={handleFinalRegistration} 
            />
          )}
          {step === STEPS.RESULT && (
            <Result 
              result={visitResult} 
              onReset={resetAll} 
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="z-20 bg-white border-t border-gov-border py-4">
        <div className="gov-container flex flex-col md:flex-row items-center justify-between gap-4 grayscale opacity-60">
           <div className="flex items-center gap-6">
              <img src="https://upload.wikimedia.org/wikipedia/en/9/95/Digital_India_logo.svg" alt="Digital India" className="h-8" />
              <div className="h-4 w-px bg-slate-300" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                An Initiative of the Government of India
              </p>
           </div>
           <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Accessibility</span>
              <span className="text-gov-primary font-mono opacity-100">NODE_VMS_DEMO_01</span>
           </div>
        </div>
      </footer>

      {/* Deterministic Demo Mode Selector (Hidden unless ?demo=true) */}
      {showDemoUI && (
        <div className="fixed bottom-6 right-6 z-[100] bg-white border-2 border-gov-primary p-4 rounded-xl shadow-2xl animate-bounce">
           <div className="flex items-center gap-3 mb-2 text-gov-primary">
              <AlertCircle className="w-5 h-5" />
              <span className="font-bold text-xs uppercase tracking-widest">Demo Scenario Control</span>
           </div>
           <div className="flex gap-2">
              {[1, 2, 3].map(v => (
                <button
                  key={v}
                  onClick={() => setDemoVisitor(v)}
                  className={`w-10 h-10 rounded-lg font-bold transition-all ${demoVisitor === v ? 'bg-gov-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {v}
                </button>
              ))}
           </div>
           <p className="mt-2 text-[10px] text-slate-400 max-w-[150px] leading-tight">
             Select visitor ID for next scan: 1 (OK), 2 (Review), 3 (Reject).
           </p>
        </div>
      )}
    </div>
  )
}

export default App
