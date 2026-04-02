import React, { useState, useRef, useEffect } from 'react'
import { Camera, RefreshCcw, CheckCircle2, User, ShieldCheck } from 'lucide-react'

function FaceCapture({ onCapture, onSkip }) {
  const [stream, setStream] = useState(null)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const [error, setError] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      })
      setStream(s)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch (err) {
      setError("Unable to access camera. Please ensure it is connected.")
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas) {
      const context = canvas.getContext('2d')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Draw frame
      context.scale(-1, 1)
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      
      const photo = canvas.toDataURL('image/jpeg', 0.9)
      setCapturedPhoto(photo)
      stopCamera()
    }
  }

  const handleDone = () => {
    onCapture(capturedPhoto)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-gov-primary tracking-tight">Security Face Capture</h2>
        <p className="text-gov-text-muted font-medium italic">सुरक्षा के लिए चेहरा कैप्चर करें</p>
      </div>

      <div className="gov-card p-4 bg-slate-50 relative">
        <div className="aspect-square relative rounded-2xl overflow-hidden bg-black border-4 border-white shadow-inner">
           {capturedPhoto ? (
             <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
           ) : error ? (
             <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                <AlertTriangle className="w-16 h-16 text-yellow-500" />
                <p className="text-white text-lg font-bold">{error}</p>
                <button onClick={onSkip} className="gov-button-secondary border-white text-white">Skip Biometrics</button>
             </div>
           ) : (
             <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover scale-x-[-1]"
             />
           )}

           {/* Guidelines Overlay */}
           {!capturedPhoto && !error && (
             <div className="absolute inset-x-0 bottom-10 flex flex-col items-center pointer-events-none">
                <div className="w-64 h-80 border-2 border-dashed border-white/40 rounded-[100px] mb-4" />
                <p className="bg-black/40 backdrop-blur px-4 py-1 rounded-full text-[10px] text-white font-bold uppercase tracking-widest">
                   Keep face within the frame
                </p>
             </div>
           )}
           
           <canvas ref={canvasRef} className="hidden" />

           {/* Verification Badge */}
           <div className="absolute top-6 right-6">
              <div className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg flex items-center gap-2">
                 <ShieldCheck className={`w-5 h-5 ${capturedPhoto ? 'text-gov-success' : 'text-gov-primary'}`} />
                 <span className="text-[10px] font-bold text-gov-primary uppercase tracking-widest">Biometric Check</span>
              </div>
           </div>
        </div>

        <div className="mt-6 flex gap-4">
           {!capturedPhoto ? (
             <button 
              onClick={capture}
              className="flex-1 gov-button-primary py-5 text-xl tracking-wide"
             >
               <Camera className="w-6 h-6" /> CAPTURE PHOTO
             </button>
           ) : (
             <>
               <button 
                onClick={() => { setCapturedPhoto(null); startCamera(); }}
                className="flex-1 gov-button-secondary py-5 text-xl tracking-wide group"
               >
                 <RefreshCcw className="w-5 h-5 group-active:rotate-180 transition-transform" /> RETAKE
               </button>
               <button 
                onClick={handleDone}
                className="flex-2 gov-button-primary py-5 text-xl tracking-wide bg-gov-success hover:bg-green-700"
               >
                 <CheckCircle2 className="w-6 h-6" /> PROCEED
               </button>
             </>
           )}
        </div>
      </div>

      <div className="flex items-start gap-4 p-5 bg-white/50 border border-gov-border rounded-xl">
         <div className="p-2 bg-blue-50 rounded-lg"><User className="w-5 h-5 text-gov-primary" /></div>
         <p className="text-[11px] text-gov-text-muted leading-relaxed font-medium">
            This photo will be matched against your ID for identity validation. 
            Ensure you are in a well-lit area and looking directly at the camera.
         </p>
      </div>
    </div>
  )
}

import { AlertTriangle } from 'lucide-react'
export default FaceCapture
