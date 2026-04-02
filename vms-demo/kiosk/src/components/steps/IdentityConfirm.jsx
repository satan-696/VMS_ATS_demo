import React, { useState } from 'react'
import { Check, ClipboardList, User, Calendar, MapPin, Search, ChevronRight } from 'lucide-react'

const DEPARTMENTS = [
  "Intelligence Bureau", "Home Ministry", "Communications Wing", 
  "Operations Division", "Administration", "Legal Cell", 
  "IT & Cyber Cell", "Visitor Reception", "Other"
]

function IdentityConfirm({ visitor, onConfirm, onBack }) {
  const [formData, setFormData] = useState({
    purpose: visitor.purpose || '',
    department: visitor.department || DEPARTMENTS[0],
    host_officer: visitor.host_officer || ''
  })

  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!formData.purpose) e.purpose = "Purpose is required"
    if (!formData.host_officer) e.host_officer = "Host name is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleConfirm = () => {
    if (validate()) {
      onConfirm(formData)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-extrabold text-gov-primary tracking-tight">Confirm Your Identity</h2>
        <p className="text-gov-text-muted font-medium italic">कृपया अपनी पहचान की पुष्टि करें</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: ID Data */}
        <div className="lg:col-span-1 space-y-6">
           <div className="gov-card flex flex-col items-center p-8 bg-blue-50/50">
              <div className="w-40 h-40 bg-white rounded-2xl shadow-gov border-4 border-white overflow-hidden relative group">
                 {visitor.reference_photo_base64 ? (
                    <img 
                      src={`data:image/jpeg;base64,${visitor.reference_photo_base64}`} 
                      alt="Aadhaar Photo" 
                      className="w-full h-full object-cover"
                    />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                       <User className="w-16 h-16" />
                    </div>
                 )}
                 <div className="absolute inset-0 bg-gov-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-6 text-center">
                 <h3 className="text-2xl font-bold text-gov-primary uppercase leading-tight">{visitor.name}</h3>
                 <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-gov-primary text-white rounded-full text-[10px] font-bold tracking-widest uppercase">
                    Verified ID
                 </div>
              </div>
           </div>

           <div className="gov-card p-6 divide-y divide-gov-border">
              <div className="py-3 flex items-start gap-4">
                 <Calendar className="w-5 h-5 text-gov-accent shrink-0 mt-0.5" />
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Date of Birth</p>
                    <p className="font-bold text-gov-primary mt-1">{visitor.dob}</p>
                 </div>
              </div>
              <div className="py-3 flex items-start gap-4">
                 <MapPin className="w-5 h-5 text-gov-accent shrink-0 mt-0.5" />
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Address</p>
                    <p className="text-xs font-bold text-gov-primary leading-tight mt-1 line-clamp-3">{visitor.address || "New Delhi, India"}</p>
                 </div>
              </div>
              <div className="py-3 flex items-start gap-4">
                 <div className="w-5 h-5 flex items-center justify-center bg-gov-primary text-white rounded text-[8px] font-bold shrink-0 mt-0.5">UID</div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Aadhaar Number</p>
                    <p className="font-mono text-xs tracking-[0.2em] font-bold text-gov-primary mt-1">XXXX-XXXX-{visitor.aadhaarMasked?.slice(-4) || "0000"}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Visit Details */}
        <div className="lg:col-span-2 space-y-6">
           <div className="gov-card p-10 space-y-8">
              <div className="flex items-center gap-3 border-b-2 border-gov-bg pb-6">
                 <div className="p-3 bg-gov-bg rounded-xl"><ClipboardList className="w-6 h-6 text-gov-primary" /></div>
                 <h4 className="text-xl font-bold text-gov-primary uppercase tracking-tight">Meeting Details / बैठक का विवरण</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="col-span-2 sm:col-span-1 space-y-2">
                    <label className="text-xs font-bold text-gov-primary uppercase tracking-widest leading-none">Department / विभाग</label>
                    <select 
                      className="gov-input bg-slate-50 border-transparent focus:bg-white"
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                    >
                       {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <div className="col-span-2 sm:col-span-1 space-y-2">
                    <label className="text-xs font-bold text-gov-primary uppercase tracking-widest leading-none">Host Officer / मेजबान अधिकारी</label>
                    <div className="relative">
                       <Search className="absolute left-4 top-4 w-5 h-5 text-slate-300 pointer-events-none" />
                       <input 
                        type="text" 
                        required
                        placeholder="e.g. Inspector Sharma"
                        className={`gov-input bg-slate-50 border-transparent focus:bg-white pl-12 ${errors.host_officer ? 'border-red-400 focus:border-red-400 bg-red-50' : ''}`}
                        value={formData.host_officer}
                        onChange={e => setFormData({...formData, host_officer: e.target.value})}
                       />
                       {errors.host_officer && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 leading-none">{errors.host_officer}</p>}
                    </div>
                 </div>
                 <div className="col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gov-primary uppercase tracking-widest leading-none">Purpose of Visit / मिलने का उद्देश्य</label>
                    <textarea 
                      required
                      placeholder="Specify your business at ATS HQ..."
                      className={`gov-input bg-slate-50 border-transparent focus:bg-white resize-none ${errors.purpose ? 'border-red-400 focus:border-red-400 bg-red-50' : ''}`}
                      rows="4"
                      value={formData.purpose}
                      onChange={e => setFormData({...formData, purpose: e.target.value})}
                    />
                    {errors.purpose && <p className="text-[10px] text-red-500 font-bold uppercase mt-1 leading-none">{errors.purpose}</p>}
                 </div>
              </div>

              <div className="pt-6">
                 <button 
                  onClick={handleConfirm}
                  className="gov-button-primary w-full py-5 text-xl tracking-wide group flex items-center justify-center gap-2"
                 >
                   CONFIRM & PROCEED
                   <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                 </button>
                 <button 
                  onClick={onBack}
                  className="w-full mt-4 text-xs font-bold uppercase text-gov-text-muted hover:text-gov-primary tracking-[0.2em]"
                 >
                   Incorrect Data? Scan Again
                 </button>
              </div>
           </div>

           <div className="flex items-center gap-4 px-6 py-4 bg-white/50 border border-dashed border-gov-border rounded-xl">
              <Check className="w-5 h-5 text-gov-success" />
              <p className="text-[10px] font-medium text-gov-text-muted uppercase tracking-widest">
                Data securely matched with UIDAI e-Aadhaar records for <span className="text-gov-primary font-bold">NODE_VMS_ATS_HQ</span>
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}

export default IdentityConfirm
