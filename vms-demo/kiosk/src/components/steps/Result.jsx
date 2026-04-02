import React, { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, XCircle, RotateCcw, Printer, ShieldCheck } from 'lucide-react'
import * as api from '../../services/api'

function Result({ result, onReset }) {
  const [status, setStatus] = useState(result?.status || 'PENDING')
  const [details, setDetails] = useState(result || {})
  const pollRef = useRef(null)
  
  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    // If still pending (from Aadhaar risk review or manual review), poll for admin approval
    if (status === 'PENDING' || status === 'PENDING_MANUAL_REVIEW') {
      pollRef.current = setInterval(async () => {
        try {
          const res = await api.getVisitStatus(result?.visitId)
          const data = res.data
          if (data?.status && data?.status !== 'PENDING' && data?.status !== 'PENDING_MANUAL_REVIEW') {
            setStatus(data.status)
            setDetails(prev => ({ ...prev, ...data }))
            clearInterval(pollRef.current)
          }
        } catch (e) {
          // Keep polling silently
        }
      }, 5000)
    }
    return () => clearInterval(pollRef.current)
  }, [result, status])

  const isPending = status === 'PENDING' || status === 'PENDING_MANUAL_REVIEW'
  const isApproved = status === 'APPROVED'
  const isRejected = status === 'REJECTED'
  const isManual = result?.status === 'PENDING_MANUAL_REVIEW' || result?.verification_type === 'manual_document'

  return (
    <div className="flex flex-col items-center space-y-10 animate-in fade-in zoom-in-95 duration-700 px-4 max-w-2xl mx-auto">
      {/* Status Icon */}
      <div className="relative">
        <div className={`absolute -inset-6 rounded-full blur-2xl animate-pulse ${isApproved ? 'bg-green-500/20' : isPending ? 'bg-blue-500/20' : 'bg-red-500/20'}`} />
        <div className={`relative w-36 h-36 rounded-full flex items-center justify-center border-4 ${isApproved ? 'bg-green-50 border-gov-success' : isPending ? 'bg-blue-50 border-gov-primary' : 'bg-red-50 border-red-600'}`}>
          {isApproved && <CheckCircle2 className="w-20 h-20 text-gov-success" />}
          {isPending && <Clock className="w-20 h-20 text-gov-primary animate-spin" style={{ animationDuration: '3s' }} />}
          {isRejected && <XCircle className="w-20 h-20 text-red-600" />}
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-3">
        <h2 className={`text-4xl font-extrabold tracking-tight ${isApproved ? 'text-gov-success' : isPending ? 'text-gov-primary' : 'text-red-700'}`}>
          {isApproved ? 'ENTRY APPROVED' : isPending ? (isManual ? 'UNDER REVIEW' : 'PENDING APPROVAL') : 'ENTRY DENIED'}
        </h2>
        <p className="text-gov-text-muted font-medium italic">
          {isApproved ? 'प्रवेश स्वीकृत है' : isPending ? 'अनुमोदन की प्रतीक्षा में' : 'प्रवेश अस्वीकृत'}
        </p>
      </div>

      {/* Gate Pass (only on approval) */}
      {isApproved && (
        <div className="w-full bg-white border-2 border-gov-primary rounded-2xl overflow-hidden shadow-gov-lg">
          {/* Pass Header */}
          <div className="bg-gov-primary text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-lg"><ShieldCheck className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-200">Official Gate Pass</p>
                <p className="font-bold text-lg leading-tight">ATS Headquarters</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-2xl font-extrabold">{details?.visitId || details?.visit_id || 'VMS-0000'}</p>
              <p className="text-[10px] text-blue-200 uppercase tracking-widest">Visit Ref ID</p>
            </div>
          </div>

          {/* Side-by-Side Photos Section */}
          <div className="flex p-6 gap-6 items-center border-b border-gov-border">
            <div className="flex gap-4 shrink-0">
               {/* Left: ID Photo / Aadhaar Photo */}
               <div className="flex flex-col items-center gap-1">
                  {details?.aadhaar_photo_url ? (
                    <img 
                      src={`${BACKEND_URL}${details.aadhaar_photo_url}`} 
                      alt="Aadhaar"
                      className="w-[80px] h-[100px] object-cover rounded border-2 border-gov-border shadow-sm print:block"
                    />
                  ) : details?.verification_type === 'aadhaar_manual_otp' ? (
                    <div className="w-[80px] h-[100px] bg-blue-50 border-2 border-gov-primary/30 rounded flex flex-col items-center justify-center p-2 text-center">
                       <ShieldCheck className="w-6 h-6 text-gov-primary mb-1" />
                       <span className="text-[7px] font-bold text-gov-primary leading-tight uppercase">Verified on UIDAI Tathya</span>
                    </div>
                  ) : details?.document_photo_path ? (
                    <img 
                      src={`${BACKEND_URL}${details.document_photo_path}`} 
                      alt="ID Document"
                      className="w-[80px] h-[100px] object-cover rounded border-2 border-gov-border shadow-sm print:block"
                    />
                  ) : (
                    <div className="w-[80px] h-[100px] bg-slate-100 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                       <span className="text-[8px] font-bold text-center p-1 uppercase">Photo Not Available</span>
                    </div>
                  )}
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
                    {details?.verification_type === 'manual_document' ? 'ID Document' : 'Aadhaar Photo'}
                  </span>
               </div>

               {/* Right: Live Photo */}
               <div className="flex flex-col items-center gap-1">
                  {details?.live_photo_url ? (
                    <img 
                      src={`${BACKEND_URL}${details.live_photo_url}`} 
                      alt="Live Capture"
                      className="w-[80px] h-[100px] object-cover rounded border-2 border-gov-primary/50 shadow-sm print:block"
                    />
                  ) : (
                    <div className="w-[80px] h-[100px] bg-slate-100 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                       <ShieldCheck className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                  <span className="text-[7px] font-bold text-gov-primary uppercase tracking-widest">Live Photo</span>
               </div>
            </div>

            <div className="flex-1 space-y-1">
               <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Name of Visitor</p>
               <p className="text-2xl font-extrabold text-gov-primary uppercase leading-none">
                 {details?.visitor_name || details?.visitor?.name || 'Verified Visitor'}
               </p>
               <div className="flex flex-col gap-1 mt-2">
                 <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold bg-gov-bg text-gov-primary px-2 py-0.5 rounded border border-gov-border uppercase">
                      {details?.verification_type?.replace(/_/g, ' ') || 'Identity Verified'}
                    </span>
                 </div>
                 {details?.aadhaar_masked && (
                   <p className="text-[10px] font-mono font-bold text-gov-text-muted">ID: {details.aadhaar_masked}</p>
                 )}
               </div>
            </div>
          </div>

          {/* Pass Body */}
          <div className="divide-y divide-gov-border">
            {[
              { label: 'Purpose', value: details?.purpose || details?.visitor?.purpose || 'Official Visit' },
              { label: 'Department', value: details?.department || details?.visitor?.department || '--' },
              { label: 'Host Officer', value: details?.host_officer || details?.visitor?.host_officer || '--' },
              { label: 'Entry Date', value: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { label: 'Valid Until', value: '8 Hours from Issue' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between px-8 py-3.5 hover:bg-blue-50/30 transition-colors">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</span>
                <span className="font-bold text-gov-primary text-right text-xs ml-8 max-w-xs">{item.value}</span>
              </div>
            ))}
          </div>

          {/* Security Footer */}
          <div className="bg-gov-bg px-8 py-4 flex items-center justify-between border-t border-gov-border">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gov-success animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gov-success">VERIFIED & CLEARED</span>
            </div>
            <button className="flex items-center gap-2 text-gov-primary text-xs font-bold uppercase tracking-widest hover:underline" onClick={() => window.print()}>
              <Printer className="w-4 h-4" /> Print Pass
            </button>
          </div>
        </div>
      )}

      {/* Pending State */}
      {isPending && (
        <div className="w-full bg-blue-50 border-2 border-gov-primary/20 rounded-2xl p-8 space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-lg font-bold text-gov-primary">
              {isManual ? 'Your documents have been submitted to the officer at the reception.' : 'Your visit is pending officer approval.'}
            </p>
            <p className="text-gov-text-muted font-medium text-sm">
              {isManual ? 'Please wait while the officer reviews your documents.' : 'A duty officer will review your visit shortly.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 py-4 px-6 bg-white rounded-xl border border-blue-100 text-gov-primary text-sm font-bold uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-gov-accent animate-ping" />
            <Clock className="w-4 h-4" />
            Waiting for officer approval... (auto-updates)
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Reference: {result?.visitId}  |  Est. Wait: 10-15 mins
          </p>
        </div>
      )}

      {/* Rejection State */}
      {isRejected && (
        <div className="w-full bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center space-y-4">
          <p className="text-red-800 font-bold text-lg">Entry has been denied by security protocol.</p>
          <p className="text-red-700 text-sm font-medium">
            Please contact the reception officer for further assistance.
            <br />कृपया रिसेप्शन अधिकारी से संपर्क करें।
          </p>
        </div>
      )}

      {/* Reset Button */}
      <button
        onClick={onReset}
        className="gov-button-secondary py-4 px-10 text-base tracking-wide group"
      >
        <RotateCcw className="w-5 h-5 group-active:rotate-180 transition-transform" />
        START NEW REGISTRATION
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .shadow-gov-lg, .shadow-gov-lg * { visibility: visible; }
          .shadow-gov-lg {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: 2px solid #1a3c6e !important;
            box-shadow: none !important;
          }
          .no-print, button { display: none !important; }
        }
      `}} />

      <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest">
        This terminal will auto-reset in 3 minutes for security.
      </p>
    </div>
  )
}

export default Result
