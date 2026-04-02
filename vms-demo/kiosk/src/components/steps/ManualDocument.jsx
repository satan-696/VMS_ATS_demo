import React, { useState, useRef, useEffect } from 'react'
import { Camera, Upload, RotateCcw, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import * as api from '../../services/api'

const DEPARTMENTS = [
  "Intelligence Bureau", "Home Ministry", "Communications Wing", 
  "Operations Division", "Administration", "Legal Cell", 
  "IT & Cyber Cell", "Visitor Reception", "Other"
]

const DOC_TYPES = [
  { id: 'aadhaar_card', label: 'Aadhaar Card / आधार कार्ड (Self + Officer)' },
  { id: 'driving_license', label: 'Driving License / चालक लाइसेंस' },
  { id: 'passport', label: 'Passport / पासपोर्ट' },
  { id: 'voter_id', label: 'Voter ID / मतदाता पहचान पत्र' },
  { id: 'pan_card', label: 'PAN Card / पैन कार्ड' },
  { id: 'other', label: 'Other Govt ID / अन्य सरकारी आईडी' }
]

function ManualDocument({ onComplete, onBack }) {
  const [formData, setFormData] = useState({
    full_name: '',
    document_type: 'aadhaar_card',
    aadhaar_number: '',
    purpose: '',
    department: DEPARTMENTS[0],
    host_officer: ''
  })
  
  const [stream, setStream] = useState(null)
  const [docPhoto, setDocPhoto] = useState(null)
  const [livePhoto, setLivePhoto] = useState(null)
  const [useFileUpload, setUseFileUpload] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const videoRefLive = useRef(null)
  const videoRefDoc = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const [internalStep, setInternalStep] = useState(1) // 1 = Face, 2 = Form/ID

  useEffect(() => {
    if (!useFileUpload && internalStep === 2) {
      startWebcam()
    } else if (internalStep === 1) {
      startWebcam()
    }
    return () => stopWebcam()
  }, [useFileUpload, internalStep])

  const startWebcam = async () => {
    setError(null)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1280, height: 720 } 
      })
      setStream(s)
      if (videoRefLive.current) videoRefLive.current.srcObject = s
      if (videoRefDoc.current) videoRefDoc.current.srcObject = s
    } catch (err) {
      console.error("Webcam error:", err)
      setUseFileUpload(true)
    }
  }

  useEffect(() => {
    if (stream) {
      if (internalStep === 1) {
        if (videoRefLive.current && !videoRefLive.current.srcObject) videoRefLive.current.srcObject = stream
      } else if (internalStep === 2) {
        if (videoRefDoc.current && !videoRefDoc.current.srcObject) videoRefDoc.current.srcObject = stream
      }
    }
  }, [stream, formData.document_type, useFileUpload, livePhoto, docPhoto, internalStep])

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capturePhoto = (type) => {
    const video = type === 'live' ? videoRefLive.current : videoRefDoc.current
    const canvas = canvasRef.current
    if (video && canvas) {
      const context = canvas.getContext('2d')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob((blob) => {
        if (type === 'live') setLivePhoto(blob)
        else setDocPhoto(blob)
      }, 'image/jpeg', 0.9)
    }
  }

  const blobToBase64 = (blob) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size too large (Max 5MB)")
        return
      }
      setDocPhoto(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!livePhoto) {
      setError("Please capture your live photo.")
      return
    }
    if (formData.document_type !== 'aadhaar_card' && !docPhoto) {
      setError("Please capture or upload your document photo.")
      return
    }

    setLoading(true)
    setError(null)
    
    // IMPORTANT: Aadhaar OTP backend also needs live photo for officer verification
    const liveB64 = await blobToBase64(livePhoto)
    const docB64 = await blobToBase64(docPhoto)

    // NEW Logic for Aadhaar Manual OTP path
    if (formData.document_type === 'aadhaar_card') {
      try {
        const res = await api.initiateManualOTP({
          full_name: formData.full_name,
          aadhaar_number: formData.aadhaar_number,
          purpose: formData.purpose,
          department: formData.department,
          host_officer: formData.host_officer,
          live_photo_base64: liveB64,
          document_photo_base64: docB64
        })
        onComplete({ ...res.data, verification_type: 'aadhaar_manual_otp' })
        return
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to initiate Aadhaar relay.")
        setLoading(false)
        return
      }
    }

    const data = new FormData()
    data.append('document_photo', docPhoto, 'document.jpg')
    data.append('live_photo_base64', liveB64)
    data.append('full_name', formData.full_name)
    data.append('document_type', formData.document_type)
    data.append('purpose', formData.purpose)
    data.append('department', formData.department)
    data.append('host_officer', formData.host_officer)

    try {
      const res = await api.registerManualDocument(data)
      onComplete(res.data)
    } catch (err) {
      setError("Failed to submit documents. Please check your connection.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gov-primary" />
         </button>
         <div>
            <h2 className="text-2xl font-bold text-gov-primary">Manual Identity Verification</h2>
            <p className="text-sm text-gov-text-muted">मैनुअल पहचान सत्यापन</p>
         </div>
      </div>

      {internalStep === 1 ? (
        <div className="flex flex-col items-center max-w-2xl mx-auto space-y-6">
           <div className="text-center space-y-2 mb-4">
              <h3 className="text-2xl font-bold text-gov-primary uppercase tracking-widest">Step 1: Face Verification</h3>
              <p className="text-gov-text-muted">Please look straight at the camera to capture your live photo.</p>
           </div>
           
           <div className="gov-card p-4 relative bg-slate-50 flex flex-col border border-gov-border rounded-xl w-full">
              <div className="relative rounded-lg overflow-hidden bg-black flex items-center justify-center border-2 border-dashed border-gov-border aspect-[4/3] w-full max-w-lg mx-auto">
                 {livePhoto ? (
                    <img src={URL.createObjectURL(livePhoto)} className="w-full h-full object-cover scale-x-[-1]" alt="Live face" />
                 ) : (
                    <video ref={videoRefLive} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                 )}
                 {livePhoto && (
                    <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur px-3 py-1 rounded text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-1">
                       <CheckCircle2 className="w-3 h-3"/> CAPTURED
                    </div>
                 )}
              </div>
              
              <div className="mt-6 flex flex-col gap-3">
                 <button 
                  type="button"
                  onClick={() => capturePhoto('live')}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${livePhoto ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-gov-primary text-white hover:bg-gov-secondary shadow-lg'}`}
                 >
                   <Camera className="w-5 h-5" /> {livePhoto ? 'RETAKE PHOTO' : 'CAPTURE PHOTO'}
                 </button>
                 
                 {livePhoto && (
                   <button 
                    type="button"
                    onClick={() => {stopWebcam(); setInternalStep(2)}}
                    className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2"
                   >
                     CONTINUE TO FORM & ID <ChevronLeft className="w-5 h-5 rotate-180" />
                   </button>
                 )}
              </div>
           </div>
           <canvas ref={canvasRef} className="hidden" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Photo Capture */}
          <div className="space-y-6">
             <div className="gov-card p-4 bg-slate-50 border border-gov-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <img src={URL.createObjectURL(livePhoto)} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm scale-x-[-1]" alt="Live face" />
                   <div>
                      <h4 className="text-xs font-bold text-gov-primary uppercase tracking-widest">Face Captured</h4>
                      <button type="button" onClick={() => setInternalStep(1)} className="text-[10px] font-bold text-gov-accent hover:underline uppercase">Retake Photo</button>
                   </div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
             </div>

             {/* Section 2: ID Document */}
             <div className="gov-card p-4 relative bg-slate-50 flex flex-col border border-gov-border rounded-xl">
                <h3 className="text-sm font-bold text-gov-primary uppercase tracking-widest mb-3 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <span className="bg-gov-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span> 
                      ID Document Capture
                   </div>
                   {!docPhoto && (
                      <button type="button" onClick={() => setUseFileUpload(!useFileUpload)} className="text-[10px] text-gov-primary bg-white px-3 py-1.5 rounded-lg border border-gov-border hover:bg-slate-100 flex items-center gap-1">
                         {useFileUpload ? <Camera className="w-3 h-3"/> : <Upload className="w-3 h-3"/>}
                         {useFileUpload ? 'Scan with Camera' : 'Upload File Instead'}
                      </button>
                   )}
                </h3>
                
                <div className="relative rounded-lg overflow-hidden bg-black flex items-center justify-center border-2 border-dashed border-gov-border aspect-[4/3]">
                   {docPhoto ? (
                      <img src={URL.createObjectURL(docPhoto)} className="w-full h-full object-contain" alt="ID Document" />
                   ) : useFileUpload ? (
                      <div className="flex flex-col items-center p-8 text-center space-y-4">
                         <div className="p-4 bg-white/10 rounded-full text-white/40"><Upload className="w-10 h-10" /></div>
                         <p className="text-white/60 text-sm font-medium">Please upload a clear photo of your ID card</p>
                         <button type="button" onClick={() => fileInputRef.current.click()} className="gov-button-primary bg-white text-gov-primary hover:bg-slate-100 py-3 px-6 rounded-xl">Select ID File</button>
                      </div>
                   ) : (
                      <video ref={videoRefDoc} autoPlay playsInline className="w-full h-full object-cover" />
                   )}
                   {docPhoto && (
                      <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur px-3 py-1 rounded text-[10px] text-white font-bold uppercase tracking-widest flex items-center gap-1">
                         <CheckCircle2 className="w-3 h-3"/> SECURED
                      </div>
                   )}
                </div>
                
                <div className="mt-4">
                   <button 
                    type="button"
                    onClick={() => useFileUpload && !docPhoto ? fileInputRef.current.click() : capturePhoto('doc')}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${docPhoto ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-gov-primary text-white hover:bg-gov-secondary shadow-lg'}`}
                   >
                     {useFileUpload && !docPhoto ? <Upload className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                     {docPhoto ? 'RETAKE ID PHOTO' : useFileUpload ? 'UPLOAD FILE' : 'CAPTURE ID PHOTO'}
                   </button>
                </div>
             </div>

             <canvas ref={canvasRef} className="hidden" />
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3 mt-4">
                <AlertCircle className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-yellow-800 leading-relaxed font-medium">
                  Ensure the name and photo on your ID card are clearly visible. Poor quality photos may lead to entry rejection.
                </p>
             </div>
          </div>

        {/* Right Column: Details Form */}
        <div className="space-y-6">
           <div className="space-y-4">
              <div>
                 <label className="block text-xs font-bold text-gov-primary uppercase tracking-widest mb-2">ID Type / पहचान पत्र का प्रकार</label>
                 <select 
                  className="gov-input bg-white appearance-none cursor-pointer"
                  value={formData.document_type}
                  onChange={e => setFormData({...formData, document_type: e.target.value})}
                 >
                     {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
               </div>

               {formData.document_type === 'aadhaar_card' && (
                 <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-xs font-bold text-gov-primary uppercase tracking-widest mb-2">Aadhaar Number / आधार नंबर</label>
                    <input 
                      type="text" 
                      required
                      maxLength={12}
                      placeholder="12 digit Aadhaar number"
                      className="gov-input font-mono text-lg tracking-widest"
                      value={formData.aadhaar_number}
                      onChange={e => setFormData({...formData, aadhaar_number: e.target.value.replace(/\D/g, '')})}
                    />
                    <p className="mt-1 text-[10px] text-gov-text-muted italic">Note: Officer will assist with OTP verification after submission.</p>
                 </div>
               )}

              <div>
                 <label className="block text-xs font-bold text-gov-primary uppercase tracking-widest mb-2">Full Name / पूरा नाम</label>
                 <input 
                  type="text" 
                  required
                  placeholder="Enter as per ID"
                  className="gov-input"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-gov-primary uppercase tracking-widest mb-2">Department / विभाग</label>
                    <select 
                      className="gov-input bg-white appearance-none cursor-pointer"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                    >
                       {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-gov-primary uppercase tracking-widest mb-2">Host Officer / मेजबान अधिकारी</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. S.K. Mishra"
                      className="gov-input"
                      value={formData.host_officer}
                      onChange={e => setFormData({...formData, host_officer: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-xs font-bold text-gov-primary uppercase tracking-widest mb-2">Purpose of Visit / मिलने का उद्देश्य</label>
                 <textarea 
                  required
                  rows="3"
                  placeholder="Reason for meeting..."
                  className="gov-input resize-none"
                  value={formData.purpose}
                  onChange={e => setFormData({...formData, purpose: e.target.value})}
                 />
              </div>
           </div>

           {error && (
             <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> {error}
             </div>
           )}

           <button 
            type="submit" 
            disabled={loading || !docPhoto || (formData.document_type === 'aadhaar_card' && formData.aadhaar_number.length !== 12)}
            className="gov-button-primary w-full py-5 text-xl tracking-wide disabled:opacity-30 rounded-xl font-bold shadow-lg mt-6"
           >
             {loading ? (
               <><RotateCcw className="w-6 h-6 animate-spin" /> SUBMITTING...</>
             ) : (
               <><CheckCircle2 className="w-6 h-6" /> SUBMIT FOR REVIEW</>
             )}
           </button>
        </div>
        </form>
      )}
    </div>
  )
}

export default ManualDocument
