import React, { useEffect, useState } from 'react'
import { Loader2, ShieldCheck, Search, Activity, CheckCircle2 } from 'lucide-react'

function Processing({ onComplete, visitor }) {
  const [currentStep, setCurrentStep] = useState(0)
  const protocols = [
    { id: 'liveness', label: 'Verifying liveness...', sub: 'सजीवता की जाँच' },
    { id: 'biometric', label: 'Matching biometric signatures...', sub: 'बायोमेट्रिक डेटा मिलान' },
    { id: 'blacklist', label: 'Scanning security database...', sub: 'सुरक्षा डेटाबेस स्कैन' },
    { id: 'risk', label: 'Assessing risk level...', sub: 'जोखिम स्तर का आकलन' },
    { id: 'finalize', label: 'Finalizing credentials...', sub: 'क्रेडेंशियल्स को अंतिम रूप' }
  ]

  useEffect(() => {
    let timer
    const advance = (idx) => {
      if (idx < protocols.length) {
        timer = setTimeout(() => {
          setCurrentStep(idx + 1)
          advance(idx + 1)
        }, 1200 + Math.random() * 800)
      } else {
        onComplete()
      }
    }
    advance(0)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-12 animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute -inset-10 bg-gov-primary/5 rounded-full animate-ping" />
        <div className="relative bg-white p-12 rounded-full shadow-gov-lg border-2 border-gov-primary overflow-hidden">
           <Loader2 className="w-24 h-24 text-gov-primary animate-spin" />
           <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-gov-accent opacity-50" />
           </div>
        </div>
      </div>

      <div className="space-y-3 text-center">
        <h2 className="text-3xl font-extrabold text-gov-primary tracking-tight">Security Protocol in Progress</h2>
        <p className="text-gov-text-muted font-medium italic">सुरक्षा प्रोटोकॉल प्रक्रिया में है</p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {protocols.map((p, idx) => (
          <div 
            key={p.id}
            className={`flex items-center gap-4 transition-all duration-500 ${idx === currentStep ? 'opacity-100 scale-105' : idx < currentStep ? 'opacity-40 scale-100' : 'opacity-20 translate-y-2'}`}
          >
            <div className={`p-2 rounded-lg transition-colors ${idx < currentStep ? 'bg-gov-success text-white' : idx === currentStep ? 'bg-gov-primary text-white shadow-lg animate-pulse' : 'bg-slate-200 text-slate-400'}`}>
               {idx < currentStep ? <CheckCircle2 className="w-5 h-5" /> : idx === currentStep ? <Search className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
            </div>
            <div className="flex-1">
               <p className={`text-sm font-bold uppercase tracking-widest ${idx === currentStep ? 'text-gov-primary' : 'text-slate-500'}`}>
                  {p.label}
               </p>
               <p className="text-[10px] font-bold text-slate-400 mb-0.5">{p.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-gov-border shadow-inner">
         <div 
          className="h-full bg-gov-primary transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,51,102,0.3)]"
          style={{ width: `${(currentStep / protocols.length) * 100}%` }}
         />
      </div>

      <div className="flex items-center gap-4 px-6 py-3 bg-blue-50 border border-blue-100 rounded-full">
         <div className="w-2 h-2 rounded-full bg-gov-accent animate-pulse" />
         <p className="text-[10px] font-bold text-gov-primary uppercase tracking-widest leading-none">
            Processing Verified Node: NODE_VMS_ATS_HQ_SECURED
         </p>
      </div>
    </div>
  )
}

export default Processing