import React, { useState, useRef, useEffect } from 'react'
import { Camera, Upload } from 'lucide-react'

function FaceCapture({ onCapture, onSkip }) {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [counting, setCounting] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      setStream(mediaStream)
      if (videoRef.current) videoRef.current.srcObject = mediaStream
      setError(null)
    } catch (err) {
      console.error('Camera error:', err)
      setError('Camera access denied or unavailable.')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleCapture = () => {
    setCounting(3)
    const timer = setInterval(() => {
      setCounting((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          takePhoto()
          return null
        }
        return prev - 1
      })
    }, 1000)
  }

  const takePhoto = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('Camera frame unavailable. Please retry capture.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) {
      setError('Unable to initialize photo capture.')
      return
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9)
    onCapture(photoDataUrl)
  }

  const handleManualUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCapture(reader.result)
      }
    }
    reader.onerror = () => {
      setError('Failed to read uploaded image. Please try another file.')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center space-y-6 text-center sm:space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-display font-bold uppercase tracking-[0.12em] text-white sm:text-4xl">Biometric Capture</h2>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
          Subject liveness and facial geometry validation
        </p>
      </div>

      <div className="glass-panel relative w-full max-w-[430px] overflow-hidden rounded-[48px] border border-ats-accent/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <div className="relative aspect-[4/5] w-full">
          <div className="absolute inset-0 bg-ats-accent/5 opacity-20" />

          {error ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 p-6 text-center">
              <Camera className="h-14 w-14 text-ats-danger opacity-50" />
              <div className="rounded border border-ats-danger/30 bg-ats-danger-dim p-3 text-[10px] font-mono uppercase text-ats-danger sm:text-xs">
                [HARDWARE ERR] {error}
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/4 top-1/4 h-1/2 w-1/2 rounded-full border border-dashed border-ats-accent/40 animate-pulse-slow" />
                <div className="absolute left-4 top-4 text-[8px] font-mono text-ats-accent/60 sm:left-6 sm:top-6">REC [?] 1080P_S_VMS</div>
                <div className="absolute bottom-4 right-4 text-[8px] font-mono text-ats-accent/60 sm:bottom-6 sm:right-6">SCAN_RT_GEO_0x44</div>
              </div>

              {counting && (
                <div className="absolute inset-0 flex items-center justify-center bg-ats-bg/60 font-display text-7xl font-bold text-ats-accent sm:text-8xl">
                  {counting}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="w-full space-y-4">
        {stream && !error ? (
          <button
            onClick={handleCapture}
            disabled={counting !== null}
            className="gov-btn gov-btn-primary w-full py-4 text-base shadow-[0_0_20px_rgba(34,211,238,0.2)] sm:py-5 sm:text-lg"
          >
            {counting ? 'CALIBRATING...' : <span className="flex items-center gap-3"><Camera className="h-5 w-5" /> COMMENCE BIO-SCAN</span>}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <label className="gov-btn gov-btn-primary w-full cursor-pointer py-4 text-base sm:py-5 sm:text-lg">
              <Upload className="mr-3 h-5 w-5" /> MANUAL IMAGE UPLOAD
              <input type="file" accept="image/*" className="hidden" onChange={handleManualUpload} />
            </label>

            <button
              onClick={onSkip}
              className="w-full py-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 transition-colors hover:text-white sm:text-xs"
            >
              Handheld biometric bypass (duty guard only)
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[8px] font-mono uppercase tracking-widest text-slate-600 sm:text-[10px]">
        <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-ats-accent" /> Neutral expression</div>
        <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-ats-accent" /> Frontal illumination</div>
        <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-ats-accent" /> Eyes forward</div>
      </div>
    </div>
  )
}

export default FaceCapture
