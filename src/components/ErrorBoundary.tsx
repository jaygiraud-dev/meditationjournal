import { Component, type ReactNode } from 'react'

type State = { error: Error | null }

// Shows the crash on screen instead of a blank page, so a problem can be
// read off the phone or screenshot without a developer console.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="auth" style={{ justifyContent: 'flex-start' }}>
        <div className="label gold">Something went wrong</div>
        <div className="card">
          <div className="body" style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 13, wordBreak: 'break-word' }}>
            {this.state.error.message}
          </div>
        </div>
        <button className="btn outline" onClick={() => location.reload()}>Reload</button>
      </div>
    )
  }
}
