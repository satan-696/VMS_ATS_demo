import React, { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ExternalLink, Loader2, ChevronLeft, ShieldCheck, CheckCircle2, Clock } from 'lucide-react'
import * as api from '../../services/api'

function DigiLocker({ onComplete, onBack }) {
  const [clientId, setClientId] = useState(null)
  const [webLink, setWebLink] = useState('')
  const [status, setStatus] = useState('entering') // entering, submitting, waiting, done
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    initSession()
    return () => {
        if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const initSession = async () => {
    try {
      const res = await api.initializeDigiLocker({ 
          redirect_url: window.location.origin + '/callback' 
      })
      if (res.data.success) {
        setClientId(res.data.client_id)
        setWebLink(res.data.web_link)
        setStatus('waiting')
        startPolling(res.data.client_id)
      } else {
        setError("Could not initialize DigiLocker. Please try another method.")
      }
    } catch (err) {
      setError("Service connection failed. Please contact reception.")
    }
  }

  const startPolling = (cid) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.getDigiLockerStatus(cid)
        if (res.data.status === 'completed') {
          clearInterval(pollRef.current)
          fetchResult(cid)
        } else if (res.data.status === 'failed') {
          clearInterval(pollRef.current)
          setError("Verification failed or cancelled.")
        }
      } catch (e) {
        // Silent retry
      }
    }, 3000)
  }

  const fetchResult = async (cid) => {
    setStatus('fetching')
    try {
      const res = await api.getDigiLockerResult(cid)
      if (res.data.success) {
        setStatus('done')
        setTimeout(() => {
          onComplete({
              ...res.data,
              verification_type: 'aadhaar_digilocker'
          })
        }, 1500)
      } else {
        setError("Failed to retrieve identity data.")
      }
    } catch (err) {
      setError("Error fetching verification data.")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-gov-primary" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gov-primary">DigiLocker Verification</h2>
          <p className="text-sm text-gov-text-muted">डिजीटॉकर सत्यापन</p>
        </div>
      </div>

      <div className="gov-card p-10 flex flex-col items-center text-center space-y-8 bg-white relative overflow-hidden">
        {status === 'initializing' && (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-gov-primary animate-spin" />
            <p className="font-bold text-gov-primary animate-pulse">Initializing Secure Gateway...</p>
          </div>
        )}

        {status === 'waiting' && (
            <>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-800">Scan QR or Use Link</h3>
                    <p className="text-sm text-gov-text-muted max-w-sm">
                        Open your phone camera to scan the QR code and login to DigiLocker to share your Aadhaar details.
                    </p>
                </div>

                <div className="relative group p-4 bg-white rounded-2xl border-2 border-gov-border shadow-gov transition-all hover:border-gov-primary">
                    <QRCodeSVG 
                        value={webLink} 
                        size={220}
                        level="L"
                        includeMargin={true}
                    />
                    <div className="absolute inset-0 bg-gov-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="w-full max-w-md space-y-4">
                    <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <Clock className="w-5 h-5 text-gov-primary animate-pulse" />
                        <p className="text-xs font-bold text-gov-primary uppercase tracking-wider">Waiting for mobile consent...</p>
                    </div>
                </div>
            </>
        )}

        {status === 'fetching' && (
           <div className="py-20 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gov-primary/20 rounded-full blur-xl animate-ping" />
                <Loader2 className="w-16 h-16 text-gov-primary animate-spin relative" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-extrabold text-gov-primary tracking-tight">VERIFYING WITH UIDAI</p>
                <p className="text-xs font-bold text-gov-text-muted uppercase tracking-[0.2em]">Don't close this window</p>
              </div>
           </div>
        )}

        {status === 'done' && (
           <div className="py-20 flex flex-col items-center gap-6 text-gov-success">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-gov-success animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-extrabold tracking-tight">IDENTITY VERIFIED</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Retrieving secure profile...</p>
              </div>
           </div>
        )}

        {error && (
            <div className="p-6 bg-red-50 border-2 border-red-100 rounded-2xl space-y-4 w-full">
                <p className="font-bold text-red-700">{error}</p>
                <button 
                    onClick={initSession}
                    className="gov-button-primary bg-red-600 hover:bg-red-700 w-full"
                >
                    RETRY INITIALIZATION
                </button>
            </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-gov-border">
          <ShieldCheck className="w-5 h-5 text-gov-primary shrink-0" />
          <p className="text-[10px] font-medium text-gov-text-muted uppercase tracking-widest leading-relaxed">
              Secured by DigiLocker National Gateway. Your consent is required for each verification.
          </p>
      </div>
    </div>
  )
}

export default DigiLocker
