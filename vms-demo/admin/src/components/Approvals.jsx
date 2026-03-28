import React, { useState, useEffect } from 'react'
import * as api from '../services/api'
import { Check, X, Clock, User, FileText } from 'lucide-react'

function Approvals() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState('OLD')

  useEffect(() => {
    fetchPending()
    const interval = setInterval(fetchPending, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchPending = async () => {
    try {
      const res = await api.getPendingApprovals()
      setPending(res.data)
      setLoading(false)
    } catch (err) {
      console.error("Fetch error:", err)
    }
  }

  const handleAction = async (visitId, action) => {
    try {
      if (action === 'approve') await api.approveVisit(visitId)
      else await api.rejectVisit(visitId)
      fetchPending()
    } catch (err) {
      alert("Action failed")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gov-blue">Pending Approvals</h2>
          <p className="text-gov-text-secondary">Review and authorize visitor entry requests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gov-border/50 rounded-lg p-1">
             <button onClick={() => setSortOrder('NEW')} className={`px-3 py-1 text-xs font-bold rounded ${sortOrder === 'NEW' ? 'bg-white shadow text-gov-blue' : 'text-gov-text-secondary'}`}>Newest</button>
             <button onClick={() => setSortOrder('OLD')} className={`px-3 py-1 text-xs font-bold rounded ${sortOrder === 'OLD' ? 'bg-white shadow text-gov-blue' : 'text-gov-text-secondary'}`}>Oldest</button>
          </div>
          <div className="text-xs font-mono bg-gov-blue/5 px-3 py-1 rounded border border-gov-blue/10">
            Last Sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {pending.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gov-border rounded-xl p-20 text-center space-y-4">
            <Clock className="w-12 h-12 text-gov-gray mx-auto" />
            <p className="text-gov-text-secondary text-lg">No pending requests at the moment</p>
          </div>
        ) : (
          [...pending]
            .sort((a, b) => {
               const dateA = new Date(a.created_at || parseInt(a.visit_id.split('-')[1] || 0)).getTime()
               const dateB = new Date(b.created_at || parseInt(b.visit_id.split('-')[1] || 0)).getTime()
               return sortOrder === 'NEW' ? dateB - dateA : dateA - dateB
            })
            .map(row => (
            <div key={row.visit_id} className="bg-white rounded-xl shadow-sm border border-gov-border p-6 flex items-center justify-between group hover:border-gov-blue transition-all">
              <div className="flex gap-6 items-center">
                <div className="w-16 h-16 bg-gov-gray rounded-lg flex items-center justify-center font-bold text-xl text-gov-blue border border-gov-border">
                  {row.visitor_name[0]}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gov-blue">{row.visitor_name}</h3>
                    <span className="text-[10px] bg-gov-amber/10 text-gov-amber px-2 py-0.5 rounded-full font-bold border border-gov-amber/20 uppercase tracking-widest">
                       {row.risk_level} Risk
                    </span>
                    {row.face_match_source === 'signzy_live' ? (
                      <span className="text-[10px] bg-gov-green/10 text-gov-green px-2 py-0.5 rounded-full font-bold border border-gov-green/20 flex items-center gap-1 uppercase tracking-widest">
                        <Check className="w-3 h-3" /> Signzy Live
                      </span>
                    ) : (
                      <span className="text-[10px] bg-gov-orange/10 text-gov-orange px-2 py-0.5 rounded-full font-bold border border-gov-orange/20 flex items-center gap-1 uppercase tracking-widest">
                        <Clock className="w-3 h-3" /> Mock Mode
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 text-sm text-gov-text-secondary">
                    <span className="flex items-center gap-1"><FileText className="w-4 h-4" /> {row.purpose}</span>
                    <span className="flex items-center gap-1 font-mono">ID: {row.visit_id}</span>
                    <span>To: <span className="font-bold">{row.host_officer}</span> ({row.department})</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleAction(row.visit_id, 'reject')}
                  className="p-3 rounded-lg text-gov-red hover:bg-gov-red/10 border border-transparent hover:border-gov-red/30"
                  title="Reject Entry"
                >
                  <X className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => handleAction(row.visit_id, 'approve')}
                  className="bg-gov-blue hover:bg-gov-blue-light text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Check className="w-5 h-5" /> APPROVE ENTRY
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Approvals
