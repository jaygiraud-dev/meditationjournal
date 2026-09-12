import { Sheet } from './Sheet'
import { supabase } from '../lib/supabase'

export function AccountSheet({ open, onClose, email, trackName, onClearTrack }: {
  open: boolean; onClose: () => void; email: string; trackName: string | null; onClearTrack: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} head={<div className="sheet-title">Account</div>}>
      <div className="card">
        <div className="label">Signed in as</div>
        <div className="body">{email}</div>
      </div>
      {trackName && (
        <div className="card">
          <div className="label">Track</div>
          <div className="body">{trackName}</div>
          <button className="btn ghost" onClick={() => { onClearTrack(); onClose() }}>Remove track from this device</button>
        </div>
      )}
      <div className="muted">Your sessions, script and reviews are private to your account. Your track stays on this phone.</div>
      <button className="btn outline" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </Sheet>
  )
}
