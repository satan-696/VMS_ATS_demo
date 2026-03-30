import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, Printer, RotateCcw } from 'lucide-react'
import { getVisitStatus } from '../../services/api'

function Result({ result, onReset }) {
  const [status, setStatus] = useState(result.status)
  const [visitId, setVisitId] = useState(result.visitId)
  const [isPrinting, setIsPrinting] = useState(false)
  const [printMode, setPrintMode] = useState(() => localStorage.getItem('kiosk_print_mode') || 'THERMAL')
  const visitor = result?.visitor || {}
  const isThermalMode = printMode === 'THERMAL'

  useEffect(() => {
    let interval
    if (status === 'PENDING') {
      interval = setInterval(async () => {
        try {
          const res = await getVisitStatus(visitId)
          if (res.data.status !== 'PENDING') {
            setStatus(res.data.status)
            clearInterval(interval)
          }
        } catch (err) {
          console.error('Polling error:', err)
        }
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [status, visitId])

  useEffect(() => {
    const onAfterPrint = () => setIsPrinting(false)
    window.addEventListener('afterprint', onAfterPrint)
    return () => window.removeEventListener('afterprint', onAfterPrint)
  }, [])

  useEffect(() => {
    localStorage.setItem('kiosk_print_mode', printMode)
  }, [printMode])

  const baseCard = 'glass-panel w-full max-w-3xl overflow-hidden border-t-4'
  const livePhoto = visitor.live_photo_base64 || visitor.reference_photo_base64 || ''

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const handlePrintPass = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
      <style>{`
        @media print {
          @page {
            size: ${isThermalMode ? '80mm auto' : 'auto'};
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: ${isThermalMode ? '80mm' : '100%'} !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * { visibility: hidden !important; }
          #kiosk-print-pass, #kiosk-print-pass * { visibility: visible !important; }
          #kiosk-print-pass {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: ${isThermalMode ? '80mm' : '100%'} !important;
            display: block !important;
            opacity: 1 !important;
          }
          #kiosk-print-pass .print-card {
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            width: ${isThermalMode ? '79mm' : '100%'} !important;
            min-height: ${isThermalMode ? 'auto' : '100vh'} !important;
            margin: ${isThermalMode ? '0.5mm' : '0'} !important;
            border: 0.3mm solid #111827 !important;
            border-radius: ${isThermalMode ? '1.5mm' : '0'} !important;
            overflow: hidden !important;
            font-size: ${isThermalMode ? '3.2mm' : '4mm'} !important;
          }
          #kiosk-print-pass .print-header {
            padding: ${isThermalMode ? '2mm 2.5mm' : '3mm 4mm'} !important;
          }
          #kiosk-print-pass .print-body {
            padding: ${isThermalMode ? '2mm 2.5mm' : '4mm'} !important;
            grid-template-columns: ${isThermalMode ? '22mm 1fr' : '32% 1fr'} !important;
            gap: ${isThermalMode ? '2mm' : '4mm'} !important;
          }
          #kiosk-print-pass .print-photo {
            height: ${isThermalMode ? '28mm' : '42mm'} !important;
          }
          #kiosk-print-pass .print-details {
            font-size: ${isThermalMode ? '3.1mm' : '4.2mm'} !important;
            line-height: ${isThermalMode ? '1.35' : '1.4'} !important;
          }
        }
      `}</style>

      {status === 'APPROVED' && (
        <div
          id="kiosk-print-pass"
          className="bg-white text-slate-900"
          style={{
            position: 'fixed',
            left: '-10000px',
            top: 0,
            width: isThermalMode ? '80mm' : '100vw',
            opacity: isPrinting ? 1 : 0
          }}
        >
          <div className="print-card" style={{ border: '2px solid #0f172a', margin: '24px', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="print-header" style={{ background: '#0f172a', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ letterSpacing: '0.06em', fontSize: '3.3mm' }}>ATS VISITOR PASS</strong>
              <span>{visitId}</span>
            </div>
            <div className="print-body" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '170px 1fr', gap: '18px' }}>
              <div className="print-photo" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', height: '210px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {livePhoto ? (
                  <img src={livePhoto} alt="Live Visitor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '12px', color: '#64748b' }}>No live photo captured</span>
                )}
              </div>
              <div className="print-details" style={{ fontSize: '14px', lineHeight: 1.5 }}>
                <div><strong>Visitor:</strong> {visitor.name || '-'}</div>
                <div><strong>Aadhaar:</strong> {visitor.aadhaarMasked || '-'}</div>
                <div><strong>Purpose:</strong> {visitor.purpose || '-'}</div>
                <div><strong>Department:</strong> {visitor.department || '-'}</div>
                <div><strong>Host Officer:</strong> {visitor.host_officer || '-'}</div>
                <div><strong>Duration:</strong> {visitor.duration || '-'}</div>
                <div><strong>Status:</strong> {status}</div>
                <div><strong>Pass ID:</strong> {visitId || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'APPROVED' ? (
        <div className={`${baseCard} border-ats-success shadow-[0_0_50px_rgba(16,185,129,0.15)]`}>
          <div className="flex flex-col gap-3 border-b border-ats-success/10 bg-ats-success/5 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 text-ats-success sm:gap-5">
              <div className="rounded border border-ats-success/30 p-2">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-display font-bold tracking-[0.12em] sm:text-2xl">CLEARANCE GRANTED</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Authorization Status: LEVEL_1_SECURE</span>
              </div>
            </div>
            <div className="w-fit rounded border border-ats-success/20 bg-ats-success/10 px-3 py-1 font-mono text-xs font-bold text-ats-success">GATE A1</div>
          </div>

          <div className="relative flex flex-col items-center space-y-8 p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 p-6 opacity-5 sm:p-10">
              <CheckCircle2 className="h-36 w-36 text-ats-success sm:h-52 sm:w-52" />
            </div>

            <div className="relative z-10 text-center">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-widest text-slate-500">Subject Authorized</p>
              <h3 className="text-3xl font-display font-bold tracking-[0.08em] text-white sm:text-4xl lg:text-5xl">{visitor.name}</h3>
              <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.18em] text-ats-accent sm:text-xs">VMS_UUID: {visitId}</p>
            </div>

            <div className="grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="group relative rounded border border-ats-accent/20 bg-slate-900/50 p-4 sm:p-6">
                <div className="absolute -inset-0.5 bg-ats-accent/10 opacity-30 blur transition duration-1000 group-hover:opacity-100" />
                <div className="relative z-10 flex h-44 items-center justify-center border border-dashed border-ats-accent/30 bg-ats-bg sm:h-48">
                  {livePhoto ? (
                    <img src={livePhoto} alt="Live capture" className="h-full w-full object-cover brightness-110" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <span className="text-[8px] font-mono uppercase tracking-widest text-slate-500">No live photo captured</span>
                    </div>
                  )}
                </div>
                <span className="mt-2 block text-center text-[8px] font-mono uppercase tracking-widest text-ats-accent">LIVE_BIO_CAPTURE</span>
              </div>

              <div className="group relative rounded border border-ats-accent/20 bg-slate-900/50 p-4 sm:p-6">
                <div className="absolute -inset-0.5 bg-ats-accent/10 opacity-30 blur transition duration-1000 group-hover:opacity-100" />
                <div className="relative z-10 flex h-44 items-center justify-center border border-dashed border-ats-accent/30 bg-ats-bg sm:h-48">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className="h-28 w-28 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ATS_VMS_CLEARANCE')] bg-contain grayscale brightness-200" />
                    <span className="text-[8px] font-mono uppercase tracking-widest text-ats-accent">SECURE_GATE_TOKEN</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 border-t border-ats-accent/10 pt-6 font-mono sm:grid-cols-2 sm:gap-8 sm:pt-8">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Entry Window</p>
                <p className="text-xl font-bold text-ats-success sm:text-2xl">10:00:00</p>
              </div>
              <div className="text-center">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Exit Threshold</p>
                <p className="text-xl font-bold text-ats-danger sm:text-2xl">13:00:00</p>
              </div>
            </div>

            <div className="relative z-10 flex w-full flex-col gap-3 pt-2 sm:flex-row sm:gap-5">
              <label className="flex items-center gap-2 rounded border border-ats-accent/20 bg-slate-900/50 px-3 py-2 text-xs font-mono uppercase tracking-widest text-slate-300 sm:w-auto">
                Print Mode
                <select
                  value={printMode}
                  onChange={(e) => setPrintMode(e.target.value)}
                  className="rounded border border-ats-accent/20 bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-200 focus:border-ats-accent focus:outline-none"
                >
                  <option value="FULL">Full Page</option>
                  <option value="THERMAL">Thermal 80mm</option>
                </select>
              </label>
              <button
                onClick={handlePrintPass}
                className="gov-btn gov-btn-secondary flex-1 border-ats-accent/20 text-ats-accent/70 transition-all hover:border-ats-accent hover:text-ats-accent"
              >
                <Printer className="mr-2 h-5 w-5" /> PRINT VISITOR PASS
              </button>
              <button
                onClick={onReset}
                className="gov-btn gov-btn-primary flex-1 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                <RotateCcw className="mr-2 h-5 w-5" /> TERMINATE SESSION
              </button>
            </div>

            <p className="text-center text-[9px] font-mono uppercase tracking-[0.18em] text-slate-600 sm:text-[10px]">
              Credentials successfully transmitted to encrypted device.
            </p>
          </div>
        </div>
      ) : status === 'REJECTED' ? (
        <div className={`${baseCard} border-ats-danger shadow-[0_0_50px_rgba(239,68,68,0.15)]`}>
          <div className="flex items-center gap-4 border-b border-ats-danger/10 bg-ats-danger/5 p-5 text-ats-danger sm:p-8">
            <div className="rounded border border-ats-danger/30 p-2">
              <XCircle className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold tracking-[0.1em] sm:text-2xl">ACCESS RESTRICTED</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Security Flag: ERR_B_0x01</span>
            </div>
          </div>

          <div className="relative space-y-6 overflow-hidden p-5 text-center sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 p-6 opacity-5 sm:p-10">
              <XCircle className="h-36 w-36 text-ats-danger sm:h-52 sm:w-52" />
            </div>

            <p className="relative z-10 text-xl font-display font-bold uppercase tracking-[0.08em] text-white sm:text-2xl">
              Entry credentials could not be validated.
            </p>

            <div className="relative z-10 space-y-3">
              <p className="text-xs font-mono uppercase leading-relaxed tracking-[0.14em] text-slate-400">
                Mandatory background scrutiny failed at secondary level.
                Please report to high-security desk for manual override.
              </p>
              <div className="group relative overflow-hidden rounded border border-ats-danger/20 bg-ats-danger/10 p-5">
                <div className="absolute inset-0 animate-pulse bg-ats-danger/5 opacity-20" />
                <p className="mb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-ats-danger">Command Line Support:</p>
                <p className="text-2xl font-display font-bold tracking-[0.2em] text-ats-danger sm:text-3xl">SEC_INT: 1044</p>
              </div>
            </div>

            <button
              onClick={onReset}
              className="gov-btn gov-btn-primary w-full border-none bg-ats-danger tracking-[0.14em] text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
            >
              INITIALIZE RESET
            </button>
          </div>
        </div>
      ) : (
        <div className={`${baseCard} border-ats-accent animate-glow`}>
          <div className="flex items-center gap-4 border-b border-ats-accent/10 bg-ats-accent/5 p-5 text-ats-accent sm:p-8">
            <div className="rounded border border-ats-accent/30 p-2">
              <Clock className="h-8 w-8 animate-pulse sm:h-10 sm:w-10" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold tracking-[0.1em] sm:text-2xl">VERIFICATION PENDING</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Queue Position: PRIORITY_SEC_01</span>
            </div>
          </div>

          <div className="space-y-6 p-5 text-center sm:p-8 lg:p-10">
            <p className="text-xl font-display font-bold uppercase tracking-[0.08em] text-white sm:text-2xl">
              Request is under secondary review
            </p>
            <p className="text-xs font-mono uppercase leading-relaxed tracking-[0.14em] text-slate-400">
              A clearance officer is reviewing your biometric credentials.
            </p>

            <div className="rounded border border-ats-accent/20 bg-ats-accent/10 p-6 font-mono sm:p-8">
              <p className="mb-2 select-none cursor-default text-[10px] font-bold uppercase tracking-widest text-ats-accent">Estimated Calibration Window:</p>
              <p className="animate-pulse text-3xl font-display font-bold tracking-[0.2em] text-ats-accent sm:text-4xl">05:00.0s</p>
            </div>

            <button
              onClick={onReset}
              className="gov-btn gov-btn-secondary w-full border-ats-accent/20 text-xs uppercase tracking-[0.14em] text-ats-accent/60 transition-all hover:border-ats-accent hover:text-ats-accent"
            >
              Terminate Protocol
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Result
