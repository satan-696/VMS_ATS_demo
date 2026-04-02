import React from 'react'
import { QrCode, FileText, ChevronLeft, ShieldCheck } from 'lucide-react'

function Options({ onSelect, onBack }) {
  const options = [
    {
      id: 'aadhaar_ovse',
      title: 'आधार सत्यापन (Aadhaar QR)',
      description: 'Verify instantly using mAadhaar App or e-Aadhaar QR code. (Recommended)',
      icon: QrCode,
      color: 'bg-blue-50 text-gov-primary'
    },
    {
      id: 'aadhaar_digilocker',
      title: 'DigiLocker (Web Link)',
      description: 'No physical ID? Verify via your phone using DigiLocker / Aadhaar Consent.',
      icon: ShieldCheck,
      color: 'bg-green-50 text-gov-success'
    },
    {
      id: 'manual_document',
      title: 'अन्य पहचान पत्र (Other ID Support)',
      description: 'No Aadhaar? Use Passport, DL, or Voter ID for manual officer review.',
      icon: FileText,
      color: 'bg-orange-50 text-gov-accent'
    }
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-2">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-gov-primary" />
         </button>
         <div>
            <h2 className="text-2xl font-bold text-gov-primary">Choose Verification Method</h2>
            <p className="text-sm text-gov-text-muted">सत्यापन विधि चुनें</p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="group flex items-start gap-6 p-8 bg-white border-2 border-gov-border rounded-2xl text-left transition-all hover:border-gov-primary hover:shadow-gov-lg active:scale-[0.98]"
          >
            <div className={`p-5 rounded-2xl transition-transform group-hover:scale-110 ${opt.color}`}>
              <opt.icon className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gov-primary mb-2 group-hover:text-gov-secondary transition-colors">
                {opt.title}
              </h3>
              <p className="text-gov-text-muted leading-relaxed font-medium">
                {opt.description}
              </p>
            </div>
            <div className="self-center hidden sm:block">
               <div className="w-10 h-10 rounded-full border-2 border-gov-border flex items-center justify-center group-hover:border-gov-primary group-hover:bg-gov-primary transition-all">
                  <ChevronLeft className="w-5 h-5 opacity-0 group-hover:opacity-100 text-white rotate-180" />
               </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-start gap-4">
         <ShieldCheck className="w-6 h-6 text-gov-primary shrink-0 mt-0.5" />
         <div className="text-xs text-blue-900/70 font-medium leading-relaxed">
            <p className="font-bold uppercase tracking-widest mb-1 text-gov-primary">Security Note</p>
            Your biometric data is encrypted and handled in compliance with UIDAI security guidelines. 
            Official personnel will review manual documents for entry clearance.
         </div>
      </div>
    </div>
  )
}

export default Options
