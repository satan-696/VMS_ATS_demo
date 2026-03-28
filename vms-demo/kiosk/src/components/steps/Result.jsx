import React, { useState, useEffect } from 'react'
import { CheckCircle2, Clock, XCircle, Printer, RotateCcw } from 'lucide-react'
import axios from 'axios'

function Result({ result, onReset }) {
  const [status, setStatus] = useState(result.status)
  const [visitId, setVisitId] = useState(result.visitId)

  useEffect(() => {
    let interval
    if (status === 'PENDING') {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/visits/${visitId}/status`)
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

  const baseCard = 'glass-panel w-full max-w-3xl overflow-hidden border-t-4'

  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center">
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
              <h3 className="text-3xl font-display font-bold tracking-[0.08em] text-white sm:text-4xl lg:text-5xl">{result.visitor.name}</h3>
              <p className="mt-3 text-[10px] font-mono uppercase tracking-[0.18em] text-ats-accent sm:text-xs">VMS_UUID: {visitId}</p>
            </div>

            <div className="group relative rounded border border-ats-accent/20 bg-slate-900/50 p-4 sm:p-6">
              <div className="absolute -inset-0.5 bg-ats-accent/10 opacity-30 blur transition duration-1000 group-hover:opacity-100" />
              <div className="relative z-10 flex h-44 w-44 items-center justify-center border border-dashed border-ats-accent/30 bg-ats-bg sm:h-48 sm:w-48">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="h-28 w-28 bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ATS_VMS_CLEARANCE')] bg-contain grayscale brightness-200" />
                  <span className="text-[8px] font-mono uppercase tracking-widest text-ats-accent">SECURE_GATE_TOKEN</span>
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
              <button
                onClick={() => window.print()}
                className="gov-btn gov-btn-secondary flex-1 border-ats-accent/20 text-ats-accent/70 transition-all hover:border-ats-accent hover:text-ats-accent"
              >
                <Printer className="mr-2 h-5 w-5" /> PRINT KEY
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