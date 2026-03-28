import React, { useState, useEffect } from 'react'
import Login from './components/Login'
import Approvals from './components/Approvals'
import VisitorsLog from './components/VisitorsLog'
import DemoToolbar from './components/DemoToolbar'
import { LayoutDashboard, Users, UserX, Settings, LogOut, ShieldCheck, Bell } from 'lucide-react'

function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('approvals')
  const [stats, setStats] = useState({ today_visits: 0, approved: 0, pending: 0, rejected: 0, on_premise: 0 })

  useEffect(() => {
    if (user && activeTab === 'dashboard') {
      fetchStats()
      const interval = setInterval(fetchStats, 10000)
      return () => clearInterval(interval)
    }
  }, [user, activeTab])

  const fetchStats = async () => {
    try {
      const res = await api.getStats()
      setStats(res.data)
    } catch (err) {
      console.error("Stats error:", err)
    }
  }

  if (!user) return <Login onLogin={setUser} />

  const NavItem = ({ id, icon: Icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all border-l-4 ${activeTab === id ? 'bg-white/10 border-gov-orange text-white' : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-bold text-sm tracking-widest uppercase">{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen flex bg-gov-blue-bg font-sans overflow-hidden">
      <DemoToolbar />

      {/* Sidebar */}
      <aside className="w-72 bg-gov-blue text-white flex flex-col shadow-2xl relative z-20">
        <div className="p-8 pb-10 border-b border-white/10 bg-gov-blue">
          <div className="flex items-center gap-4 mb-2">
             <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
               <ShieldCheck className="w-6 h-6 text-white" />
             </div>
             <h2 className="text-xl font-bold tracking-widest">ATS VMS</h2>
          </div>
          <p className="text-[10px] text-blue-200 font-mono tracking-widest uppercase opacity-60">Control Center / एडमिन पैनल</p>
        </div>

        <nav className="flex-1 py-8">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="approvals" icon={Bell} label="Approvals Queue" />
          <NavItem id="visitors" icon={Users} label="Visitor Log" />
          <NavItem id="blacklist" icon={UserX} label="Blacklist Mgmt" />
        </nav>

        <div className="p-6 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-10 h-10 rounded-full bg-gov-orange flex items-center justify-center font-bold text-white shadow-lg">
                {user.name[0]}
             </div>
             <div>
                <p className="text-xs font-bold text-white uppercase">{user.name}</p>
                <p className="text-[10px] text-white/40 tracking-wider font-mono">{user.role}</p>
             </div>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-white/20 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gov-border flex items-center justify-between px-12 z-10">
           <div>
             <h1 className="text-xl font-bold text-gov-blue uppercase tracking-widest">
               {activeTab.replace('_', ' ')}
             </h1>
             <p className="text-xs text-gov-text-secondary opacity-60 uppercase font-mono tracking-tighter">
               VMS.System_Node_4 • Online
             </p>
           </div>
           
           <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-gov-text-secondary opacity-40 uppercase tracking-widest">System Load</span>
                <div className="w-32 h-1.5 bg-gov-border rounded-full mt-1 overflow-hidden">
                   <div className="w-[12%] h-full bg-gov-blue-light"></div>
                </div>
              </div>
              <div className="w-10 h-10 bg-gov-gray rounded-lg flex items-center justify-center border border-gov-border text-gov-blue-light cursor-pointer hover:bg-gov-blue/5">
                <Settings className="w-5 h-5" />
              </div>
           </div>
        </header>

        {/* Dynamic Section */}
        <main className="flex-1 p-12 overflow-y-auto">
          {activeTab === 'approvals' && <Approvals />}
          {activeTab === 'dashboard' && (
             <div className="grid grid-cols-3 gap-8">
                <div className="col-span-3 bg-gov-blue text-white p-8 rounded-2xl shadow-xl flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-bold">Good morning, Commander.</h3>
                      <p className="text-blue-200 opacity-60">System status is nominal. No high-risk alerts detected.</p>
                   </div>
                   <div className="text-right">
                      <p className="text-4xl font-mono font-bold tracking-widest">10:42:31</p>
                      <p className="text-[10px] opacity-40 font-mono">SERVER_TIME_LOCAL</p>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gov-border space-y-4">
                   <p className="text-xs font-bold text-gov-text-secondary uppercase tracking-widest">Total Visits Today</p>
                   <p className="text-5xl font-bold text-gov-blue">{stats.today_visits}</p>
                   <p className="text-[10px] text-gov-green font-bold">+0% from yesterday</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gov-border space-y-4">
                   <p className="text-xs font-bold text-gov-text-secondary uppercase tracking-widest">Currently On-Premise</p>
                   <p className="text-5xl font-bold text-gov-orange">{stats.on_premise}</p>
                   <p className="text-[10px] text-gov-text-secondary">Capacity: 450</p>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gov-border space-y-4">
                   <p className="text-xs font-bold text-gov-text-secondary uppercase tracking-widest">Pending Approvals</p>
                   <p className="text-5xl font-bold text-gov-amber">{stats.pending}</p>
                   <p className="text-[10px] text-gov-text-secondary">Needs attention</p>
                </div>
             </div>
          )}
          {activeTab === 'visitors' && <VisitorsLog />}
          {activeTab === 'blacklist' && (
             <div className="bg-white border border-gov-border rounded-xl p-20 text-center opacity-40">
                <p className="text-lg font-bold">Intelligence Database Module Ready</p>
             </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
