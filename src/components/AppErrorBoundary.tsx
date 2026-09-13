import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { failed: boolean }

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CertStudio application error', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="fatal-error" role="alert">
        <div className="brand-mark">C</div>
        <div className="eyebrow">Recovery</div>
        <h1>CertStudio hit an unexpected error.</h1>
        <p>Your locally saved project has not been intentionally cleared. Reload the application to restore the latest durable save.</p>
        <div><button type="button" onClick={() => window.location.reload()}>Reload CertStudio</button><button type="button" onClick={() => this.setState({ failed: false })}>Try again</button></div>
      </main>
    )
  }
}
