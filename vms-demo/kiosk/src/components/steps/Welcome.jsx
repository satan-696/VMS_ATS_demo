import React from 'react'
import { ArrowRight, ShieldCheck, UserCheck, Clock } from 'lucide-react'

function Welcome({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center space-y-10">
      <div className="relative">
        <div className="absolute -inset-4 bg-gov-accent/20 rounded-full blur-2xl animate-pulse" />
        <div className="relative bg-white p-8 rounded-full shadow-gov-lg border-2 border-gov-border">
          <ShieldCheck className="w-20 h-20 text-gov-primary" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-extrabold text-gov-primary tracking-tight">
          स्वागत हे - Welcome
        </h2>
        <p className="text-lg text-gov-text-muted max-w-md font-medium leading-relaxed mx-auto translate-x-6 md:translate-x-8">
          The ATS Visitor Management System ensures secure and efficient entry. 
          Please proceed with your identity verification.
        </p>
        <p className="text-sm text-gov-text-muted/60 hindi-text font-bold">
          एटीएस आगंतुक प्रबंधन प्रणाली सुरक्षित और कुशल प्रवेश सुनिश्चित करती है। 
          कृपया अपनी पहचान सत्यापन के साथ आगे बढ़ें।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-8">
         <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gov-border shadow-gov">
            <div className="bg-blue-50 p-3 rounded-lg"><Clock className="w-6 h-6 text-gov-primary" /></div>
            <div className="text-left">
               <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Average Time</p>
               <p className="text-sm font-bold text-gov-primary">~2 Minutes</p>
            </div>
         </div>
         <div className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gov-border shadow-gov">
            <div className="bg-blue-50 p-3 rounded-lg"><UserCheck className="w-6 h-6 text-gov-primary" /></div>
            <div className="text-left">
               <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Required</p>
               <p className="text-sm font-bold text-gov-primary">Valid Photo ID</p>
            </div>
         </div>
      </div>

      <button
        onClick={onNext}
        className="gov-button-primary w-full sm:w-80 group py-5 text-xl tracking-wide shadow-2xl flex items-center justify-center gap-2"
      >
        प्रारंभ करें • START REGISTRATION
        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
      </button>
      <p className="max-w-xl text-[10px] uppercase tracking-widest text-slate-500 sm:text-xs">
        Identity verification uses a secure UIDAI gateway. All sessions are logged and monitored.
      </p>
    </div>
  )
}

export default Welcome
