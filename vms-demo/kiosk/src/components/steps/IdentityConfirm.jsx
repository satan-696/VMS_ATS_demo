import React, { useState } from 'react'
import { CheckCircle2, Lock } from 'lucide-react'

function IdentityConfirm({ visitor, onConfirm, onBack }) {
  const [details, setDetails] = useState({
    purpose: '',
    department: '',
    host_officer: '',
    duration: '< 1 Hour'
  })

  const departments = ['Intelligence Bureau', 'Home Ministry', 'Communications', 'Operations', 'IT Services', 'Other']
  const purposes = ['Official Meeting', 'Delivery', 'Interview', 'Maintenance', 'Personal Visit']

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(details)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center space-y-6 sm:space-y-8">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-display font-bold uppercase tracking-[0.12em] text-ats-success sm:text-4xl">
          Credential Match Found
        </h2>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-400 sm:text-xs">
          Subject demographic profile extracted successfully
        </p>
      </div>

      <div className="glass-panel relative w-full overflow-hidden border border-ats-success/20 p-4 sm:p-6 lg:p-8">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-ats-success" />

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-8">
          <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-ats-accent/20 bg-slate-900 sm:h-36 sm:w-36 md:mx-0 md:h-40 md:w-40">
            {visitor.photo_url ? (
              <img
                src={visitor.photo_url}
                alt="Aadhaar photo"
                className="h-full w-full object-cover brightness-110 grayscale transition-all duration-500 hover:grayscale-0"
              />
            ) : (
              <div className="text-center">
                <div className="text-3xl font-display font-bold text-ats-accent opacity-20 sm:text-4xl">{visitor.name?.[0]}</div>
                <p className="mt-1 text-[8px] font-mono uppercase text-ats-accent/40">No static bio</p>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ats-bg to-transparent opacity-60" />
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
            <div>
              <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Subject Full Name</p>
              <p className="text-xl font-display font-bold uppercase tracking-[0.08em] text-white sm:text-2xl">{visitor.name}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Aadhaar Key</p>
              <p className="flex items-center gap-2 text-base font-mono text-ats-accent sm:text-lg">
                {visitor.aadhaarMasked} <Lock className="h-4 w-4 opacity-50" />
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Gender / DOB</p>
              <p className="text-sm font-mono text-slate-300 sm:text-base">{visitor.gender} • {visitor.dob}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">Address Record</p>
              <p className="text-xs font-mono uppercase leading-relaxed text-slate-400 sm:text-sm">{visitor.address}</p>
            </div>
          </div>

          <div className="flex flex-row items-center justify-center gap-2 md:flex-col md:items-end">
            <div className="flex items-center gap-2 rounded-full border border-ats-success/30 bg-ats-success/10 px-4 py-1 text-xs font-display font-bold text-ats-success shadow-[0_0_15px_rgba(16,185,129,0.1)] sm:text-sm">
              <CheckCircle2 className="h-4 w-4 animate-pulse sm:h-5 sm:w-5" /> VERIFIED
            </div>
            <p className="text-[8px] font-mono uppercase tracking-widest text-slate-600">UIDAI-SIG: RSA-2048-OK</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel w-full space-y-6 border-ats-accent/10 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-2 border-b border-ats-accent/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-display font-bold uppercase tracking-[0.12em] text-white sm:text-xl">Visit Authorization Form</h3>
          <span className="text-[10px] font-mono text-ats-accent/60">FORM-REF: ATS-VMS-114</span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Purpose of Visit *</label>
            <select
              required
              className="h-12 w-full rounded border border-ats-accent/20 bg-slate-900 px-3 font-mono text-sm text-slate-300 transition-all focus:border-ats-accent focus:outline-none"
              value={details.purpose}
              onChange={(e) => setDetails({ ...details, purpose: e.target.value })}
            >
              <option value="" className="bg-ats-bg text-slate-600">Select Purpose</option>
              {purposes.map((p) => (
                <option key={p} value={p} className="bg-ats-bg text-slate-300">{p}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Target Department *</label>
            <select
              required
              className="h-12 w-full rounded border border-ats-accent/20 bg-slate-900 px-3 font-mono text-sm text-slate-300 transition-all focus:border-ats-accent focus:outline-none"
              value={details.department}
              onChange={(e) => setDetails({ ...details, department: e.target.value })}
            >
              <option value="" className="bg-ats-bg text-slate-600">Select Department</option>
              {departments.map((d) => (
                <option key={d} value={d} className="bg-ats-bg text-slate-300">{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Host Officer Name *</label>
            <input
              type="text"
              required
              placeholder="ENTRY COMMANDER"
              className="h-12 w-full rounded border border-ats-accent/20 bg-slate-900 px-3 font-mono text-sm text-white placeholder:text-slate-700 focus:border-ats-accent focus:outline-none"
              value={details.host_officer}
              onChange={(e) => setDetails({ ...details, host_officer: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Expected Op-Duration</label>
            <select
              className="h-12 w-full rounded border border-ats-accent/20 bg-slate-900 px-3 font-mono text-sm text-slate-300 focus:border-ats-accent focus:outline-none"
              value={details.duration}
              onChange={(e) => setDetails({ ...details, duration: e.target.value })}
            >
              <option value="< 1 Hour" className="bg-ats-bg text-slate-300">&lt; 1 Hour</option>
              <option value="1-2 Hours" className="bg-ats-bg text-slate-300">1-2 Hours</option>
              <option value="Half Day" className="bg-ats-bg text-slate-300">Half Day</option>
              <option value="Full Day" className="bg-ats-bg text-slate-300">Full Day</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:gap-5">
          <button
            type="button"
            onClick={onBack}
            className="gov-btn gov-btn-secondary flex-1 border-ats-accent/30 text-xs uppercase tracking-widest text-ats-accent/60 transition-all hover:border-ats-accent hover:text-ats-accent"
          >
            Back
          </button>
          <button
            type="submit"
            className="gov-btn gov-btn-primary flex-[2] text-base shadow-[0_4px_25px_rgba(34,211,238,0.2)] sm:text-lg"
          >
            AUTHORIZE CLEARANCE
          </button>
        </div>
      </form>
    </div>
  )
}

export default IdentityConfirm