import React, { useState, useEffect } from 'react'
import * as api from '../services/api'
import { Check, X, Clock, FileText, ShieldCheck, FileImage, Eye, AlertCircle, Loader2, FolderSearch, ExternalLink } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const RISK_STYLES = {
  HIGH: 'bg-red-50 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-green-50 text-green-700 border-green-200',
}

const VERIFICATION_LABELS = {
  aadhaar_ovse: { label: 'Aadhaar OVSE', icon: ShieldCheck, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  aadhaar_digilocker: { label: 'DigiLocker', icon: ShieldCheck, color: 'bg-green-50 text-green-700 border-green-200' },
  aadhaar_manual_otp: { label: 'Aadhaar Manual', icon: AlertCircle, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  manual_document: { label: 'Manual Review', icon: FileImage, color: 'bg-orange-50 text-orange-700 border-orange-200' },
}

function Approvals() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewingDoc, setViewingDoc] = useState(null)
  const [processing, setProcessing] = useState(null)
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 8000)
    return () => clearInterval(interval)
  }, [])

  const fetchPending = async () => {
    try {
      const res = await api.getPendingApprovals()
      setPending(res.data)
      setLastSync(new Date())
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (visitId, action) => {
    setProcessing(`${visitId}-${action}`)
    try {
      if (action === 'approve') await api.approveVisit(visitId)
      else await api.rejectVisit(visitId)
      await fetchPending()
    } catch {
      alert("Action failed. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  const aadhaarPending = pending.filter(p => p.status === 'PENDING')
  const manualPending = pending.filter(p => p.status === 'PENDING_MANUAL_REVIEW')
  const aadhaarManualPending = pending.filter(p => p.status === 'PENDING_MANUAL_OTP')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gov-text-muted">
        <Loader2 className="w-6 h-6 animate-spin text-gov-primary" />
        <span className="font-bold uppercase tracking-widest text-sm">Loading Queue...</span>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-gov-primary/10 text-gov-primary px-3 py-1 rounded-full uppercase tracking-widest border border-gov-primary/20">
              <div className="w-1.5 h-1.5 rounded-full bg-gov-accent animate-pulse" />
              Live Queue — Auto-refresh 8s
            </span>
          </div>
          <p className="text-sm text-gov-text-muted">
            {pending.length > 0 ? `${pending.length} request${pending.length !== 1 ? 's' : ''} requiring officer action` : 'All clear — no pending requests'}
            {lastSync && <span className="ml-2 opacity-50">• Synced {lastSync.toLocaleTimeString('en-IN')}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-white border border-gov-border rounded-lg px-4 py-2 text-[11px] font-bold text-gov-text-muted">
            <ShieldCheck className="w-4 h-4 text-blue-500" /> Aadhaar: {aadhaarPending.length}
          </div>
          <div className="flex items-center gap-2 bg-white border border-gov-border rounded-lg px-4 py-2 text-[11px] font-bold text-gov-text-muted">
            <FileImage className="w-4 h-4 text-orange-500" /> Manual: {manualPending.length}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {pending.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 bg-gov-surface border-2 border-dashed border-gov-border rounded-2xl space-y-4 text-center">
          <FolderSearch className="w-16 h-16 text-gov-border" />
          <h3 className="text-xl font-bold text-gov-text-muted">No Pending Requests</h3>
          <p className="text-gov-text-muted text-sm">All visitor entries have been reviewed. The queue is empty.</p>
        </div>
      )}

      {/* Aadhaar Pending */}
      {aadhaarPending.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-blue-800">
            <ShieldCheck className="w-4 h-4" /> Aadhaar Verified — Pending Officer Review ({aadhaarPending.length})
          </h3>
          {aadhaarPending.map(row => <ApprovalCard key={row.visit_id} row={row} onAction={handleAction} processing={processing} onViewDoc={setViewingDoc} />)}
        </section>
      )}

      {/* Manual Pending */}
      {manualPending.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-orange-800">
            <FileImage className="w-4 h-4" /> Manual Document Review Required ({manualPending.length})
          </h3>
          {manualPending.map(row => <ApprovalCard key={row.visit_id} row={row} onAction={handleAction} processing={processing} onViewDoc={setViewingDoc} />)}
        </section>
      )}

      {/* Aadhaar Manual Pending (Relay) */}
      {aadhaarManualPending.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-purple-800">
            <ShieldCheck className="w-4 h-4" /> Aadhaar Manual OTP Relay ({aadhaarManualPending.length})
          </h3>
          {aadhaarManualPending.map(row => <ApprovalCard key={row.visit_id} row={row} onAction={handleAction} processing={processing} onViewDoc={setViewingDoc} />)}
        </section>
      )}

      {/* Document/Aadhaar Photo Modal */}
      {viewingDoc && (
        <VerificationModal 
          visit={viewingDoc} 
          onClose={() => setViewingDoc(null)} 
          onAction={handleAction} 
        />
      )}
    </div>
  )
}

function VerificationModal({ visit, onClose, onAction }) {
  const [manualData, setManualData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)

  const isManualOtp = visit.verification_type === 'aadhaar_manual_otp'

  useEffect(() => {
    if (isManualOtp) fetchManualData()
  }, [])

  const fetchManualData = async () => {
    setLoading(true)
    try {
      const res = await api.getManualAadhaarData(visit.visit_id)
      setManualData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const openTathyaPopup = (e) => {
    e.preventDefault();
    window.open(
      "https://tathya.uidai.gov.in/access/login?role=resident",
      "tathyaPopup",
      "width=500,height=750,left=150,top=100,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no"
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="bg-gov-primary text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <p className="font-bold text-lg leading-tight uppercase tracking-tight">{visit.visitor_name}</p>
            <p className="text-[10px] uppercase tracking-widest text-blue-200">
              {visit.verification_type.replace(/_/g, ' ')} • {visit.visit_id}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            
            {/* Left: Identity Document / Manual Data */}
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-gov-primary uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4" /> Identity Reference
              </h4>
              
              {isManualOtp ? (
                <div className="bg-white p-6 rounded-2xl border-2 border-gov-border space-y-6 shadow-sm">
                   {loading ? (
                     <div className="py-12 flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-gov-primary" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Decrypting Secure Data...</p>
                     </div>
                   ) : manualData ? (
                     <>
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 space-y-3">
                           <h5 className="text-[10px] font-bold text-blue-800 uppercase tracking-widest border-b border-blue-200/50 pb-2">Claimed Identity Snapshot</h5>
                           <div className="grid grid-cols-2 gap-4">
                             <div><span className="text-blue-600/70 block text-[10px] uppercase font-bold">Visitor Name</span><span className="font-bold text-blue-900 text-sm">{visit.visitor_name}</span></div>
                             <div><span className="text-blue-600/70 block text-[10px] uppercase font-bold">Decl. Purpose</span><span className="font-bold text-blue-900 text-sm">{visit.purpose}</span></div>
                           </div>
                           <p className="text-[10px] text-blue-700/70 italic leading-relaxed">
                             Please log into Tathya. Enter the Aadhaar number below, then request to send OTP. Once the visitor inputs the OTP in the kiosk, copy it from the relay box below and submit on Tathya to view the official profile.
                           </p>
                        </div>
                        
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Aadhaar Number</label>
                           <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xl font-extrabold text-gov-primary tracking-widest">
                              {manualData.aadhaar_number}
                              <button 
                                onClick={() => copyToClipboard(manualData.aadhaar_number, 'aadhaar')}
                                className={`ml-auto p-2 rounded-lg transition-all ${copied === 'aadhaar' ? 'bg-green-100 text-green-700' : 'bg-white hover:bg-blue-50 text-gov-primary border border-gov-border shadow-sm'}`}
                              >
                                {copied === 'aadhaar' ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold font-sans">COPY</span>}
                              </button>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-2 mt-4">
                              <label className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center justify-between">
                                 Relayed Visitor OTP
                                 {manualData.pending_otp && <span className="flex items-center gap-1 text-green-600"><Check className="w-3 h-3"/> RECEIVED</span>}
                              </label>
                              <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                 <span className="text-2xl font-black text-purple-800 tracking-[0.3em] font-mono">
                                    {manualData.pending_otp || 'WAITING...'}
                                 </span>
                                 <button 
                                   onClick={() => copyToClipboard(manualData.pending_otp, 'otp')}
                                   disabled={!manualData.pending_otp}
                                   className={`ml-auto p-2 rounded-lg transition-all ${copied === 'otp' ? 'bg-green-100 text-green-700' : 'bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-sm disabled:opacity-30'}`}
                                 >
                                   {copied === 'otp' ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold font-sans">COPY</span>}
                                 </button>
                              </div>
                           </div>

                           <button 
                             onClick={openTathyaPopup}
                             className="flex items-center justify-center gap-2 w-full p-4 bg-gov-secondary text-white rounded-xl font-bold hover:bg-gov-primary transition-all shadow-md mt-6"
                           >
                              Open UIDAI Tathya Portal <ExternalLink className="w-4 h-4" />
                           </button>
                        </div>
                     </>
                   ) : (
                     <div className="p-6 text-center text-red-600 font-bold bg-red-50 rounded-xl border border-red-100">
                        Error retrieving Aadhaar data.
                     </div>
                   )}
                </div>
              ) : visit.aadhaar_photo_url ? (
                <div className="space-y-2">
                   <img src={`${BACKEND_URL}${visit.aadhaar_photo_url}`} className="w-full rounded-2xl shadow-lg border border-gov-border" alt="ID Photo" />
                   <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aadhaar Profile Photo</p>
                </div>
              ) : visit.document_photo_path ? (
                <div className="space-y-2">
                    <img src={`${BACKEND_URL}${visit.document_photo_path}`} className="w-full rounded-2xl shadow-lg border border-gov-border" alt="Document" />
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Uploaded ID Document</p>
                </div>
              ) : (
                 <div className="w-full aspect-[4/3] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <AlertCircle className="w-10 h-10" />
                    <p className="text-xs font-bold uppercase tracking-widest">Identity Image Not Available</p>
                 </div>
              )}
            </div>

            {/* Right: Live Capture Side-by-Side */}
            <div className="space-y-6">
               <h4 className="text-xs font-bold text-gov-primary uppercase tracking-widest flex items-center gap-2">
                 <Loader2 className="w-4 h-4" /> Live Webcam Capture
               </h4>
               <div className="space-y-4">
                  {visit.live_photo_url ? (
                    <img src={`${BACKEND_URL}${visit.live_photo_url}`} className="w-full rounded-2xl shadow-xl border-4 border-gov-primary/20 aspect-[4/5] object-cover" alt="Live Capture" />
                  ) : (
                    <div className="w-full aspect-[4/5] bg-slate-100 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-slate-300 animate-spin" />
                    </div>
                  )}
                  
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                     <AlertCircle className="w-5 h-5 text-gov-primary shrink-0" />
                     <p className="text-[11px] text-blue-900 leading-relaxed font-bold italic">
                        "Visual matching is mandatory. Ensure the person in the live capture is the same as shown on the official identity document."
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-white border-t border-gov-border flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest">
             <AlertCircle className="w-4 h-4" /> Internal Policy: All manual approvals are logged
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => { onAction(visit.visit_id, 'reject'); onClose() }}
              className="px-8 py-3.5 border-2 border-red-600 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" /> REJECT ENTRY
            </button>
            <button
              onClick={() => { onAction(visit.visit_id, 'approve'); onClose() }}
              className="px-10 py-3.5 bg-gov-primary text-white font-bold rounded-xl hover:bg-gov-secondary shadow-lg transition-all flex items-center gap-2"
            >
              <Check className="w-5 h-5" /> APPROVE ENTRY
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ApprovalCard({ row, onAction, processing, onViewDoc }) {
  const riskStyle = RISK_STYLES[row.risk_level] || RISK_STYLES.LOW
  const verif = VERIFICATION_LABELS[row.verification_type] || VERIFICATION_LABELS.aadhaar_ovse
  const VerifIcon = verif.icon
  const isManual = row.status === 'PENDING_MANUAL_REVIEW'
  const isProcessing = (k) => processing === `${row.visit_id}-${k}`

  return (
    <div className="bg-gov-surface border border-gov-border rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-gov-primary/20 transition-all group">
      <div className="flex flex-wrap items-start gap-6">
        {/* Side-by-Side Thumbnails */}
        <div className="shrink-0 flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-gov-border group-hover:border-gov-primary/20 transition-colors">
          <div className="flex flex-col items-center gap-1">
             {row.aadhaar_photo_url ? (
               <img src={`${BACKEND_URL}${row.aadhaar_photo_url}`} alt="ID" className="w-[60px] h-[75px] object-cover rounded-lg border border-gov-border shadow-sm" />
             ) : row.verification_type === 'aadhaar_manual_otp' ? (
                <div className="w-[60px] h-[75px] bg-purple-50 rounded-lg flex flex-col items-center justify-center p-1 text-center border border-purple-100">
                   <ShieldCheck className="w-4 h-4 text-purple-700 mb-0.5" />
                   <span className="text-[6px] font-bold text-purple-700 leading-tight uppercase">Manual Relay</span>
                </div>
             ) : row.document_photo_path ? (
               <img src={`${BACKEND_URL}${row.document_photo_path}`} alt="Doc" className="w-[60px] h-[75px] object-cover rounded-lg border border-gov-border shadow-sm" />
             ) : (
                <div className="w-[60px] h-[75px] bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                   <span className="text-[6px] font-bold text-slate-400">NO PHOTO</span>
                </div>
             )}
             <span className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none">Identity Photo</span>
          </div>
          <div className="flex flex-col items-center gap-1">
             {row.live_photo_url ? (
                <img src={`${BACKEND_URL}${row.live_photo_url}`} alt="Live" className="w-[60px] h-[75px] object-cover rounded-lg border-2 border-gov-primary/20 shadow-sm" />
             ) : (
                <div className="w-[60px] h-[75px] bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                   <span className="text-[6px] font-bold text-slate-400 uppercase">NO LIVE</span>
                </div>
             )}
             <span className="text-[6px] font-bold text-gov-primary uppercase tracking-widest leading-none">Live Photo</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-gov-primary uppercase">{row.visitor_name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${riskStyle}`}>
              {row.risk_level} Risk
            </span>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${verif.color}`}>
              <VerifIcon className="w-3 h-3" /> {verif.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-gov-text-muted">
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span className="font-medium">{row.purpose}</span>
            </span>
            <span>
              <span className="font-bold text-gov-text">To: {row.host_officer}</span>
              <span className="mx-1">•</span>
              <span>{row.department}</span>
            </span>
            <span className="font-mono text-xs">Ref: {row.visit_id}</span>
          </div>
          {isManual && row.document_type && (
            <div className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-200 w-fit">
              <FileImage className="w-3.5 h-3.5" />
              Document: {row.document_type.replace('_', ' ').toUpperCase()}
            </div>
          )}
          <p className="text-[11px] text-gov-text-muted">{row.created_at ? new Date(row.created_at).toLocaleString('en-IN') : ''}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
          {(isManual && row.document_photo_path) || row.verification_type === 'aadhaar_manual_otp' ? (
            <button
              onClick={() => onViewDoc(row)}
              title={row.verification_type === 'aadhaar_manual_otp' ? "View Relay Details" : "View Document Photo"}
              className="p-3 border-2 border-gov-primary/30 text-gov-primary rounded-xl hover:bg-gov-primary hover:text-white transition-all"
            >
              <Eye className="w-5 h-5" />
            </button>
          ) : null}
          <button
            onClick={() => onAction(row.visit_id, 'reject')}
            disabled={!!processing}
            title="Reject Entry"
            className="p-3 border-2 border-red-200 text-gov-error rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all disabled:opacity-40"
          >
            {isProcessing('reject') ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onAction(row.visit_id, 'approve')}
            disabled={!!processing}
            className="flex items-center gap-2 bg-gov-primary hover:bg-gov-secondary text-white px-6 py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all disabled:opacity-40"
          >
            {isProcessing('approve') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            APPROVE
          </button>
        </div>
      </div>
    </div>
  )
}

export default Approvals
