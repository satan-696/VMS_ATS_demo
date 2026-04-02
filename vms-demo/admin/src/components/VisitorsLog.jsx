import React, { useState, useEffect } from 'react'
import * as api from '../services/api'
import { Clock, CheckCircle2, XCircle, Search, CalendarDays } from 'lucide-react'

function VisitorsLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [sortOrder, setSortOrder] = useState('NEW')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await api.getVisitLog()
      setLogs(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Fetch log error:', err)
    }
  }

  const filteredLogs = logs
    .filter(log => filter === 'ALL' || log.status === filter)
    .filter(
      log =>
        log.visitor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.visit_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.host_officer.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'NEW' ? dateB - dateA : dateA - dateB
    })

  const StatusIcon = ({ status }) => {
    if (status === 'APPROVED') return <CheckCircle2 className="w-5 h-5 text-gov-success" />
    if (status === 'REJECTED') return <XCircle className="w-5 h-5 text-gov-error" />
    return <Clock className="w-5 h-5 text-gov-warning animate-pulse" />
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gov-primary">Visitor Audit Log</h2>
          <p className="text-gov-text-muted">Comprehensive history of all premise access requests</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gov-text-muted" />
            <input
              type="text"
              placeholder="Search ID, Name, Officer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gov-border rounded-lg text-sm focus:outline-none focus:border-gov-primary text-gov-text"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gov-border rounded-lg px-4 py-2 text-sm text-gov-text-muted font-bold focus:outline-none focus:border-gov-primary bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div className="flex bg-gov-border/50 rounded-lg p-1">
            <button
              onClick={() => setSortOrder('NEW')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded ${sortOrder === 'NEW' ? 'bg-white shadow text-gov-primary' : 'text-gov-text-muted'}`}
            >
              <CalendarDays className="w-3 h-3" /> Newest
            </button>
            <button
              onClick={() => setSortOrder('OLD')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded ${sortOrder === 'OLD' ? 'bg-white shadow text-gov-primary' : 'text-gov-text-muted'}`}
            >
              <CalendarDays className="w-3 h-3" /> Oldest
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gov-border overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-gov-text-muted font-bold animate-pulse">LOADING SECURE AUDIT LOGS...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gov-bg border-b border-gov-border text-xs uppercase tracking-widest text-gov-text-muted">
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Time (Local)</th>
                  <th className="p-4 font-bold">Visit ID</th>
                  <th className="p-4 font-bold">Visitor Name</th>
                  <th className="p-4 font-bold">Host Officer</th>
                  <th className="p-4 font-bold">Department</th>
                  <th className="p-4 font-bold">Risk Level</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gov-text">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-gov-text-muted">
                      No matching records found.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.visit_id} className="border-b border-gov-border/50 hover:bg-gov-primary/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={log.status} />
                          <span className="text-[10px] font-bold tracking-widest uppercase">{log.status}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-gov-text-muted">
                        {new Date(log.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-4 font-mono font-bold text-gov-primary">{log.visit_id}</td>
                      <td className="p-4 font-bold">{log.visitor_name}</td>
                      <td className="p-4">{log.host_officer}</td>
                      <td className="p-4 text-gov-text-muted">{log.department}</td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border
                          ${log.risk_level === 'HIGH' ? 'bg-gov-error/10 text-gov-error border-gov-error/20' : log.risk_level === 'MEDIUM' ? 'bg-gov-warning/10 text-gov-warning border-gov-warning/20' : 'bg-gov-success/10 text-gov-success border-gov-success/20'}`}
                        >
                          {log.risk_level}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default VisitorsLog
