import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Approvals from './components/Approvals'
import VisitorsLog from './components/VisitorsLog'
import { LayoutDashboard, Bell, Users, UserX, LogOut, ShieldCheck, Settings, ChevronRight } from 'lucide-react'
import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api' })

function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('approvals')
  const [pendingCount, setPendingCount] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (user) {
      const fetchPending = async () => {
        try {
          const res = await api.get('/approvals/pending')
          setPendingCount(res.data.length)
        } catch {}
      }
      fetchPending()
      const interval = setInterval(fetchPending, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (!user) return <Login onLogin={setUser} />

  const NavItem = ({ id, icon: Icon, label, badge }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all text-left border-l-4 group relative
        ${activeTab === id
          ? 'bg-white/10 border-gov-accent text-white'
          : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
        }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="font-bold text-sm tracking-widest uppercase flex-1">{label}</span>
      {badge > 0 && (
        <div className="bg-gov-accent text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
          {badge > 9 ? '9+' : badge}
        </div>
      )}
      {activeTab === id && <ChevronRight className="w-4 h-4 text-gov-accent/60 absolute right-4" />}
    </button>
  )

  const TABS = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'approvals', icon: Bell, label: 'Approvals Queue', badge: pendingCount },
    { id: 'visitors', icon: Users, label: 'Visitor Log' },
    { id: 'blacklist', icon: UserX, label: 'Blacklist' },
  ]

  const TAB_TITLES = {
    dashboard: 'Dashboard Overview',
    approvals: 'Approvals Queue',
    visitors: 'Visitor Log',
    blacklist: 'Security Blacklist',
  }

  return (
    <div className="min-h-screen flex bg-gov-bg font-sans overflow-hidden text-gov-text">
      {/* Sidebar */}
      <aside className="w-72 bg-gov-sidebar text-white flex flex-col shadow-2xl relative z-20 shrink-0">
        {/* Branding */}
        <div className="p-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4 mb-3">
            <div className="bg-white p-2 rounded-lg shadow-sm shrink-0">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
                alt="GOI"
                className="w-10 h-10"
              />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-widest uppercase leading-tight">ATS VMS</h2>
              <p className="text-[9px] text-blue-200 uppercase tracking-[0.2em] opacity-70">Admin Control Panel</p>
            </div>
          </div>
          <div className="mt-4 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            <p className="text-[9px] uppercase tracking-widest text-blue-200 opacity-60">Node Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-bold text-green-300">OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6">
          {TABS.map(t => (
            <NavItem key={t.id} id={t.id} icon={t.icon} label={t.label} badge={t.badge} />
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="p-6 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 rounded-full bg-gov-accent text-white font-bold flex items-center justify-center shadow-lg text-sm">
              {user.name ? user.name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <p className="text-sm font-bold text-white uppercase">{user.name}</p>
              <p className="text-[10px] text-white/60 tracking-wider font-mono">{user.role} • Duty Officer</p>
            </div>
          </div>
          <button
            onClick={() => setUser(null)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-white/20 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" /> End Session
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-gov-surface border-b border-gov-border flex items-center justify-between px-10 py-5 shadow-sm z-10 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gov-primary uppercase tracking-wider">
              {TAB_TITLES[activeTab]}
            </h1>
            <p className="text-xs text-gov-text-muted font-bold uppercase tracking-widest opacity-60">
              Ministry of Home Affairs • Anti-Terrorism Squad
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xl font-bold font-mono text-gov-primary leading-none">
                {currentTime.toLocaleTimeString('en-IN', { hour12: true })}
              </p>
              <p className="text-[10px] text-gov-text-muted uppercase tracking-widest font-bold">
                {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="h-10 w-px bg-gov-border" />
            <div className="p-2 bg-gov-bg rounded-lg border border-gov-border hover:border-gov-primary transition-colors cursor-pointer">
              <Settings className="w-5 h-5 text-gov-text-muted" />
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-10 overflow-y-auto min-h-0">
          {activeTab === 'approvals' && <Approvals />}
          {activeTab === 'visitors' && <VisitorsLog />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'blacklist' && (
            <div className="flex items-center justify-center h-64 bg-gov-surface border border-gov-border rounded-2xl">
              <div className="text-center space-y-2">
                <UserX className="w-12 h-12 text-gov-text-muted/30 mx-auto" />
                <p className="text-gov-text-muted font-bold uppercase tracking-widest text-sm">Intelligence Database Module Coming Soon</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function Dashboard() {
  const [stats, setStats] = useState({ today_visits: 0, approved: 0, pending: 0, rejected: 0 })
  useEffect(() => {
    const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api' })
    api.get('/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const cards = [
    { label: 'Total Visits Today', value: stats.today_visits, color: 'text-gov-primary' },
    { label: 'Approved', value: stats.approved, color: 'text-gov-success' },
    { label: 'Pending Review', value: stats.pending, color: 'text-gov-warning' },
    { label: 'Rejected', value: stats.rejected, color: 'text-gov-error' },
  ]

  return (
    <div className="space-y-8">
      <div className="bg-gov-primary text-white p-8 rounded-2xl shadow-xl">
        <h3 className="text-2xl font-bold tracking-tight">Good day, Officer.</h3>
        <p className="text-blue-200 mt-1 opacity-80">System is operational. Review pending approvals promptly.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map(c => (
          <div key={c.label} className="bg-gov-surface border border-gov-border rounded-2xl p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gov-text-muted">{c.label}</p>
            <p className={`text-5xl font-extrabold mt-2 ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
