import React, { useState } from 'react'
import * as api from '../services/api'
import { Play, RotateCcw, Terminal, X } from 'lucide-react'

function DemoToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const isDemoMode = new URLSearchParams(window.location.search).get('demo') === 'true'

  if (!isDemoMode) return null

  const handleReset = async () => {
    if (confirm('Reset all visitor data? / क्या आप डेटा रीसेट करना चाहते हैं?')) {
      await api.resetDemo()
      window.location.reload()
    }
  }

  const triggerScenario = async (id) => {
    // In a real app, this might send a specific request to seed a visitor
    // For now, we just log it and reset to initial seeded state
    console.log(`Triggering scenario ${id}`)
    await api.resetDemo()
    window.location.reload()
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[1000] transition-all duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-8px)]'}`}>
      {/* Handle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-2 bg-gov-warning cursor-pointer hover:h-3 transition-all flex items-center justify-center group"
      >
        <div className="w-16 h-1 bg-white/50 rounded-full opacity-0 group-hover:opacity-100"></div>
      </div>

      <div className="bg-slate-900 text-white p-6 shadow-2xl border-t border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Terminal className="text-gov-warning w-6 h-6" />
            <h3 className="text-lg font-mono font-bold tracking-widest text-gov-warning">DEMO_EXECUTIVE_CONTROL</h3>
            <span className="text-[10px] bg-gov-warning/20 text-gov-warning px-2 py-0.5 rounded border border-gov-warning/30">V.2.0</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="space-y-3 bg-white/5 p-4 rounded-lg border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">Environment Controls</p>
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 bg-gov-error hover:bg-gov-error/80 text-white py-3 rounded font-bold text-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" /> RESET ALL DATA
            </button>
          </div>

          <div className="col-span-3 space-y-3 bg-white/5 p-4 rounded-lg border border-white/5">
            <p className="text-[10px] text-white/40 uppercase font-mono tracking-widest">Scenario Injectors</p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => triggerScenario(1)} className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-3 rounded text-left group">
                <div>
                  <p className="text-xs font-bold text-gov-warning">S1: LOW RISK</p>
                  <p className="text-[10px] text-white/50">Rajesh - Approved</p>
                </div>
                <Play className="w-4 h-4 text-white/20 group-hover:text-white" />
              </button>
              <button onClick={() => triggerScenario(2)} className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-3 rounded text-left group">
                <div>
                  <p className="text-xs font-bold text-gov-warning">S2: MEDIUM RISK</p>
                  <p className="text-[10px] text-white/50">Priya - Pending</p>
                </div>
                <Play className="w-4 h-4 text-white/20 group-hover:text-white" />
              </button>
              <button onClick={() => triggerScenario(3)} className="flex items-center justify-between bg-white/10 hover:bg-white/20 p-3 rounded text-left group">
                <div>
                  <p className="text-xs font-bold text-gov-error">S3: CRITICAL</p>
                  <p className="text-[10px] text-white/50">Mohammed - Checkpoint</p>
                </div>
                <Play className="w-4 h-4 text-white/20 group-hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoToolbar
