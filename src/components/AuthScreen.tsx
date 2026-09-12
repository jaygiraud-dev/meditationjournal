import { useState, type FormEvent } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null); setNotice(null)
    if (mode === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({ email, password })
      if (err) setError(err.message)
      else if (!data.session) setNotice('Check your email to confirm your account, then sign in.')
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
    }
    setBusy(false)
  }

  return (
    <div className="auth">
      <div className="stack">
        <div className="label gold">Meditation Journal</div>
        <h1 className="auth-title" style={{ margin: 0 }}>{mode === 'signin' ? 'Welcome back.' : 'Begin your practice.'}</h1>
        <p className="muted" style={{ margin: 0 }}>Sign in with the email you share your practice with.</p>
      </div>
      {!supabaseConfigured && (
        <div className="card gold">
          <div className="label gold">Setup needed</div>
          <div className="body">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file and rebuild. See the README.</div>
        </div>
      )}
      <form className="stack" style={{ gap: 14 }} onSubmit={submit}>
        <label className="field">
          <span className="label">Email</span>
          <input className="input" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="label">Password</span>
          <input className="input" type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="error">{error}</div>}
        {notice && <div className="muted">{notice}</div>}
        <button className="btn primary" type="submit" disabled={busy || !supabaseConfigured}>
          {busy ? <span className="spin" /> : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        <button className="btn ghost" type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setNotice(null) }}>
          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
