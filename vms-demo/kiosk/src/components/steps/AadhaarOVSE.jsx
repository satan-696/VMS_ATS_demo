import React, { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import * as api from '../../services/api'
import { Loader2, RefreshCw, Smartphone, ScanLine, AlertCircle } from 'lucide-react'

function AadhaarOVSE({ onComplete, onBack, demoVisitor }) {
  const [initData, setInitData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('initializing')
  const pollInterval = useRef(null)

  useEffect(() => {
    initialize()
    return () => clearInterval(pollInterval.current)
  }, [])

  const initialize = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.initializeOVSE({ 
        channel: 'qr', 
        demo_visitor: demoVisitor 
      })
      setInitData(res.data)
      setStatus('waiting')
      setLoading(false)
      startPolling(res.data.client_id)
    } catch (err) {
      setError('Initialization failed. Please try again.')
      setLoading(false)
    }
  }

  const startPolling = (clientId) => {
    clearInterval(pollInterval.current)
    pollInterval.current = setInterval(async () => {
      try {
        const res = await api.getOVSEStatus(clientId)
        if (res.data.status === 'completed') {
          clearInterval(pollInterval.current)
          fetchResult(clientId)
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 2000)
  }

  const fetchResult = async (clientId) => {
    setStatus('processing')
    try {
      const res = await api.getOVSEResult(clientId)
      onComplete(res.data)
    } catch (err) {
      setError('Result fetch failed.')
      setStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-6">
        <Loader2 className="w-16 h-16 text-gov-primary animate-spin" />
        <p className="text-xl font-bold text-gov-primary">Initializing Secure Session...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-12 space-y-6 bg-red-50 rounded-2xl border-2 border-red-200">
        <AlertCircle className="w-16 h-16 text-red-600" />
        <p className="text-xl font-bold text-red-800">{error}</p>
        <button onClick={initialize} className="gov-button-primary"><RefreshCw className="w-5 h-5" /> Retry</button>
        <button onClick={onBack} className="text-red-700 font-bold uppercase tracking-widest underline">Go Back</button>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-gov-primary tracking-tight">
          Scan QR code with mAadhaar App
        </h2>
        <p className="text-gov-text-muted font-medium">कृपया एम-आधार ऐप से क्यूआर कोड को स्कैन करें</p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-12 rounded-3xl shadow-gov-lg border-2 border-gov-primary/10 relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gov-primary rounded-tl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gov-primary rounded-br-xl" />

        <div className="relative p-6 bg-white rounded-2xl shadow-inner border-2 border-gov-border">
          <QRCodeSVG value={initData.qr_data} size={280} level="L" includeMargin={true} fgColor="#003366" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
             <ScanLine className="w-40 h-40 animate-pulse text-gov-primary" />
          </div>
        </div>

        <div className="flex-1 space-y-10">
          <div className="space-y-6">
             <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-gov-primary group-hover:bg-gov-primary group-hover:text-white transition-all text-xl font-bold">1</div>
                <div>
                   <p className="font-bold text-gov-primary">Open mAadhaar App</p>
                   <p className="text-sm text-gov-text-muted font-medium">एम-आधार ऐप खोलें</p>
                </div>
             </div>
             <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-gov-primary group-hover:bg-gov-primary group-hover:text-white transition-all text-xl font-bold">2</div>
                <div>
                   <p className="font-bold text-gov-primary">Tap 'QR Code Scanner'</p>
                   <p className="text-sm text-gov-text-muted font-medium">'क्यूआर कोड स्कैनर' पर टैप करें</p>
                </div>
             </div>
             <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-gov-primary group-hover:bg-gov-primary group-hover:text-white transition-all text-xl font-bold">3</div>
                <div>
                   <p className="font-bold text-gov-primary">Grant Permission & Scan</p>
                   <p className="text-sm text-gov-text-muted font-medium">अनुमति दें और स्कैन करें</p>
                </div>
             </div>
          </div>

          <div className="p-5 bg-gov-bg rounded-xl border border-gov-border flex items-center gap-4">
             <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Smartphone className="w-5 h-5 text-gov-primary" />
             </div>
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-gov-accent animate-pulse" />
                   <span className="text-xs font-bold uppercase tracking-widest text-gov-primary">Waiting for scan</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Ref ID: {initData.client_id.slice(-8)}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm font-bold opacity-60 px-2">
         <button onClick={onBack} className="hover:text-gov-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> RESTART PROCESS
         </button>
         <span className="text-gov-primary italic">Supported by UIDAI • eKYC Version 4.0</span>
      </div>
    </div>
  )
}

export default AadhaarOVSE
