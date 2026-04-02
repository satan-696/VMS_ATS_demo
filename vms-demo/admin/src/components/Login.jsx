import React, { useState } from 'react'
import { ShieldCheck, User, Lock } from 'lucide-react'

function Login({ onLogin }) {
  const [role, setRole] = useState('OFFICER')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Demo logic: any 4 digit password works
    if (password.length >= 4) {
      onLogin({ role, name: role === 'ADMIN' ? 'Super Admin' : 'Duty Officer' })
    } else {
      alert('Invalid credentials / अमान्य विवरण')
    }
  }

  return (
    <div className="min-h-screen bg-gov-primary flex items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-white/10 rounded-full mx-auto flex items-center justify-center border border-white/20">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-widest">ATS VMS</h1>
            <p className="text-blue-200 uppercase text-xs font-mono tracking-widest">Staff Authorization Portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gov-text-muted uppercase">Access Role</label>
              <div className="grid grid-cols-3 gap-2">
                {['ADMIN', 'OFFICER', 'GUARD'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 text-xs font-bold rounded-lg border-2 transition-all ${role === r ? 'border-gov-primary bg-gov-primary text-white' : 'border-gov-border text-gov-text-muted hover:border-gov-primary/30 hover:text-gov-text'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gov-text-muted uppercase">Staff ID / Username</label>
              <div className="relative">
                <User className="absolute left-4 top-4 w-5 h-5 text-gov-text-muted" />
                <input
                  type="text"
                  defaultValue={role.toLowerCase() + '_demo'}
                  className="w-full h-14 pl-12 pr-4 border-2 border-gov-border rounded-lg focus:border-gov-primary focus:outline-none font-medium text-gov-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gov-text-muted uppercase">Secure Passcode</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gov-text-muted" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full h-14 pl-12 pr-4 border-2 border-gov-border rounded-lg focus:border-gov-primary focus:outline-none font-medium text-gov-text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gov-primary hover:bg-gov-secondary text-white font-bold py-4 rounded-lg shadow-lg active:scale-95 transition-all text-lg"
          >
            AUTHORIZE ACCESS →
          </button>

          <p className="text-center text-xs text-gov-text-muted">
            IP: 192.168.1.104 • SECURE CHANNEL AD-401
          </p>
        </form>

        <p className="text-center text-white/40 text-xs uppercase tracking-widest pt-4">
          Government of India • Ministry of Home Affairs
        </p>
      </div>
    </div>
  )
}

export default Login
